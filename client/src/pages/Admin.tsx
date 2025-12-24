import { useState, useEffect } from "react";
import { useGame } from "@/components/GameContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SUBJECTS, Question, Subject } from "@/lib/types";
import { Upload, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { addQuestion, importQuestions } = useGame();
  const { toast } = useToast();

  const [newQ, setNewQ] = useState({
    text: "",
    subject: "",
    option0: "",
    option1: "",
    option2: "",
    option3: "",
    correct: "0"
  });

  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    password: ""
  });
  const [managingRoom, setManagingRoom] = useState<any>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);

  const handleManageRoom = (room: any) => {
    setManagingRoom(room);
    setShowManageDialog(true);
  };

  const handleDeleteRoom = async () => {
    if (!managingRoom) return;

    try {
      const response = await fetch(`/api/rooms/${managingRoom.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRooms(prev => prev.filter(r => r.id !== managingRoom.id));
        setShowManageDialog(false);
        setManagingRoom(null);
        toast({
          title: "Room Deleted",
          description: `Room "${managingRoom.name}" and its questions have been removed.`,
        });
      } else {
        throw new Error('Failed to delete room');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the room. Please try again.",
      });
    }
  };

  useEffect(() => {
    // Fetch existing rooms
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      }
    };
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoom.name || !newRoom.password || importedQuestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide room name, password, and import questions first.",
      });
      return;
    }

    try {
      // First save the questions to mockboard_questions table to get their actual database IDs
      console.log('Saving questions to mockboard_questions table:', importedQuestions.length);
      const response = await fetch('/api/mockboard-questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: importedQuestions }),
      });

      if (!response.ok) {
        throw new Error('Failed to save questions to mockboard_questions table');
      }

      const result = await response.json();
      console.log('Saved questions to mockboard_questions:', result);

      const questionIds = result.questions?.map((q: any) => q.id) || [];
      console.log('Creating room with question IDs:', questionIds);

      const roomResponse = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoom.name,
          password: newRoom.password,
          questionIds: questionIds,
        }),
      });

      console.log('Room creation response status:', roomResponse.status);

      if (roomResponse.ok) {
        const newRoomData = await roomResponse.json();
        console.log('Created room data:', newRoomData);
        setRooms(prev => [...prev, newRoomData]);
        setNewRoom({ name: "", password: "" });
        setImportedQuestions([]);
        toast({
          title: "Room Created",
          description: `Room "${newRoomData.name}" created successfully!`,
        });
      } else {
        const errorText = await response.text();
        console.error('Room creation failed:', errorText);
        throw new Error('Failed to create room');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Room Creation Failed",
        description: "Could not create the room. Please try again.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.text || !newQ.subject) return;

    addQuestion({
      id: Math.random().toString(),
      text: newQ.text,
      subject: newQ.subject as any,
      options: [newQ.option0, newQ.option1, newQ.option2, newQ.option3],
      correctAnswer: parseInt(newQ.correct),
      set: 1
    });

    setNewQ({
      text: "",
      subject: "",
      option0: "",
      option1: "",
      option2: "",
      option3: "",
      correct: "0"
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const importedQuestions: Question[] = [];

        // Parse the content (assuming simple format or JSON)
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            importedQuestions.push(...parsed);
          }
        } else {
          // Simple line-by-line parsing for multiple question formats
          const lines = content.split('\n').map(line => line.trim()).filter(line => line);
          console.log('Total lines to process:', lines.length);

          // Try to identify question blocks by looking for patterns
          let i = 0;
          while (i < lines.length) {
            let questionText = '';
            let options: string[] = [];
            let correctAnswer = 0;

            // Look for a question (line ending with ?)
            if (lines[i].endsWith('?') && lines[i].length > 10) {
              questionText = lines[i];
              i++; // Move to next line

              // Look for options (next 4 lines that don't end with ?)
              let optionCount = 0;
              while (i < lines.length && optionCount < 4 && !lines[i].endsWith('?')) {
                const line = lines[i].trim();
                if (line.length > 0) {
                  options.push(line);
                  optionCount++;
                }
                i++;
              }

              // Look for correct answer (next line that might be a number)
              if (i < lines.length) {
                const answerLine = lines[i].trim();
                const answerMatch = answerLine.match(/^(\d+)$/);
                if (answerMatch) {
                  correctAnswer = Math.min(parseInt(answerMatch[1]), 3); // Ensure valid index
                  i++; // Move past answer
                }
              }

              // Skip the subject line if it exists
              if (i < lines.length && lines[i].length > 5 && lines[i].length < 100) {
                i++; // Skip subject line
              }

              // If we have a question and at least 4 options, save it
              if (questionText && options.length >= 4 && typeof correctAnswer === 'number' && correctAnswer >= 0 && correctAnswer <= 3) {
                importedQuestions.push({
                  id: `imported-${Date.now()}-${importedQuestions.length}`,
                  text: questionText,
                  options: options.slice(0, 4), // Ensure exactly 4 options
                  correctAnswer: correctAnswer,
                  subject: 'Library Organization and Management' as Subject,
                  set: 1,
                  category: 'mockboard'
                });
                console.log(`Imported question ${importedQuestions.length}:`, questionText, 'Answer:', correctAnswer);
              } else {
                console.log(`Skipping invalid question: "${questionText?.substring(0, 50)}..." - options: ${options.length}, answer: ${correctAnswer}`);
              }
            } else {
              i++; // Skip non-question lines
            }
          }

          console.log('Parsing complete. Total questions found:', importedQuestions.length);
        }

        console.log('Final imported questions count:', importedQuestions.length); // Debug: Final count
        console.log('Imported questions:', importedQuestions); // Debug: Show all imported questions

        setImportedQuestions(importedQuestions);
        importQuestions(importedQuestions);
        toast({
          title: "Import Successful",
          description: `${importedQuestions.length} questions imported successfully.`,
        });

        // Reset file input
        e.target.value = '';
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "Could not parse the file. Please check the format.",
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Import from Docs
        </Button>
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept=".doc,.docx,.txt"
          onChange={handleImport}
        />
      </div>

      {/* Import and Room Creation Section */}
      {importedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Imported Questions ({importedQuestions.length})</span>
              <div className="flex gap-2">
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Question Preview</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {importedQuestions.map((q, idx) => (
                        <div key={q.id} className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Question {idx + 1}: {q.text}</h4>
                          <div className="space-y-1 text-sm">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={`p-2 rounded ${optIdx === q.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-50'}`}>
                                {String.fromCharCode(65 + optIdx)}) {opt}
                                {optIdx === q.correctAnswer && ' ✓'}
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Subject: {q.subject}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Name</Label>
                  <Input
                    value={newRoom.name}
                    onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                    placeholder="Enter room name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newRoom.password}
                    onChange={e => setNewRoom({...newRoom, password: e.target.value})}
                    placeholder="Enter room password..."
                  />
                </div>
              </div>
              <Button onClick={handleCreateRoom} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Rooms */}
      {rooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rooms.map((room: any) => (
                <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{room.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({room.questionIds?.length || 0} questions)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageRoom(room)}
                  >
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
           <CardHeader>
             <CardTitle>Add New Question</CardTitle>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label>Question Text</Label>
                 <Textarea
                   value={newQ.text}
                   onChange={e => setNewQ({...newQ, text: e.target.value})}
                   placeholder="Enter the question here..."
                 />
               </div>

               <div className="space-y-2">
                 <Label>Subject</Label>
                 <Select onValueChange={val => setNewQ({...newQ, subject: val})} value={newQ.subject}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select Subject" />
                   </SelectTrigger>
                   <SelectContent>
                     {Object.keys(SUBJECTS).map(s => (
                       <SelectItem key={s} value={s}>{s}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="grid grid-cols-1 gap-2">
                 {[0, 1, 2, 3].map(idx => (
                   <div key={idx} className="flex gap-2 items-center">
                      <Label className="w-20">Option {String.fromCharCode(65 + idx)}</Label>
                      <Input
                        value={(newQ as any)[`option${idx}`]}
                        onChange={e => setNewQ({...newQ, [`option${idx}`]: e.target.value})}
                        placeholder={`Option ${idx + 1}`}
                      />
                   </div>
                 ))}
               </div>

               <div className="space-y-2">
                 <Label>Correct Answer</Label>
                 <Select onValueChange={val => setNewQ({...newQ, correct: val})} value={newQ.correct}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select Correct Option" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="0">Option A</SelectItem>
                     <SelectItem value="1">Option B</SelectItem>
                     <SelectItem value="2">Option C</SelectItem>
                     <SelectItem value="3">Option D</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <Button type="submit" className="w-full">Add Question to Mock Board</Button>
             </form>
           </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {Object.keys(SUBJECTS).map(sub => (
                 <div key={sub} className="flex justify-between text-sm">
                   <span className="truncate pr-4">{sub}</span>
                   <span className="font-bold">~15 Qs</span>
                 </div>
               ))}
               <div className="pt-4 border-t flex justify-between font-bold">
                 <span>Total Questions</span>
                 <span>90+</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Management Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Room: {managingRoom?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Room Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {managingRoom?.name}</p>
                <p><strong>Questions:</strong> {managingRoom?.questionIds?.length || 0}</p>
                <p><strong>ID:</strong> {managingRoom?.id}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowManageDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRoom}
                className="flex-1"
              >
                Delete Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
