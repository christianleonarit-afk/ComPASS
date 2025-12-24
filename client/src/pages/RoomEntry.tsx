import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/components/GameContext";

export default function RoomEntry() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { startGame } = useGame();

  const [roomForm, setRoomForm] = useState({
    name: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async () => {
    if (!roomForm.name || !roomForm.password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both room name and password.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, find the room by name
      const roomsResponse = await fetch('/api/rooms');
      if (!roomsResponse.ok) throw new Error('Failed to fetch rooms');

      const rooms = await roomsResponse.json();
      const room = rooms.find((r: any) => r.name === roomForm.name);

      if (!room) {
        throw new Error('Room not found');
      }

      // Verify password
      const verifyResponse = await fetch(`/api/rooms/${room.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: roomForm.password }),
      });

      if (!verifyResponse.ok) throw new Error('Invalid password');

      const verifyResult = await verifyResponse.json();
      if (!verifyResult.valid) {
        throw new Error('Invalid password');
      }

      // Get questions for this room with batched loading to avoid overwhelming the system
      console.log('Room question IDs:', room.questionIds.length, 'total');
      const allQuestions = [];
      const batchSize = 200; // Load 200 questions at a time for better stability
      let offset = 0;
      const maxQuestions = 1000; // Limit to 1000 questions max for performance

      while (offset < room.questionIds.length && allQuestions.length < maxQuestions) {
        try {
          const questionsResponse: Response = await fetch('/api/questions/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: room.id,
              batchSize: Math.min(batchSize, maxQuestions - allQuestions.length),
              offset: offset
            })
          });

          if (!questionsResponse.ok) {
            console.error(`Failed to load batch at offset ${offset}:`, questionsResponse.status);
            throw new Error(`Failed to load questions batch (${questionsResponse.status})`);
          }

          const batchData: any = await questionsResponse.json();
          console.log(`Loaded batch ${Math.floor(offset/batchSize) + 1}: ${batchData.questions.length} questions`);

          allQuestions.push(...batchData.questions);
          offset += batchSize;

          // Small delay to prevent overwhelming the server
          if (offset < room.questionIds.length && allQuestions.length < maxQuestions) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (batchError: any) {
          console.error('Batch loading error:', batchError);
          throw new Error(`Failed to load questions: ${batchError.message}`);
        }
      }

      console.log(`Successfully loaded ${allQuestions.length} questions total`);

      // Start the game with room questions
      startGame("mock", undefined, undefined, allQuestions);

      toast({
        title: "Room Joined",
        description: `Successfully joined room "${room.name}"`,
      });

      setLocation("/mock-board");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Join Failed",
        description: error.message || "Could not join the room. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif">Join Mock Board Room</CardTitle>
          <p className="text-muted-foreground">Enter the room name and password to start your exam</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={roomForm.name}
                onChange={e => setRoomForm({...roomForm, name: e.target.value})}
                placeholder="Enter room name..."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-password">Password</Label>
              <Input
                id="room-password"
                type="password"
                value={roomForm.password}
                onChange={e => setRoomForm({...roomForm, password: e.target.value})}
                placeholder="Enter room password..."
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>
          </div>

          <Button
            onClick={handleJoinRoom}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Joining..." : "Join Room"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="w-full"
            disabled={isLoading}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
