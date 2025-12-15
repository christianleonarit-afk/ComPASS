import { useState } from "react";
import { useGame } from "@/components/GameContext";
import { Link, useLocation } from "wouter";
import { SUBJECTS } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, BookOpen, Lock, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const { user, startGame } = useGame();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [mockPasscodeOpen, setMockPasscodeOpen] = useState(false);
  const [mockCreds, setMockCreds] = useState({ user: "", pass: "" });

  const handleStartStandard = (subject: string, set: number) => {
    startGame("standard", subject, set);
    setLocation("/game");
  };

  const handleStartMock = () => {
    if (isMobile) {
      toast({
        variant: "destructive",
        title: "Desktop Only",
        description: "The Mock Board examination is not available on mobile devices.",
      });
      return;
    }
    setMockPasscodeOpen(true);
  };

  const confirmMockStart = () => {
    if (mockCreds.user === "123" && mockCreds.pass === "123") {
       startGame("mock");
       setLocation("/mock-board");
    } else {
       toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid credentials. (Hint: user: 123, pass: 123)",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary">Welcome, {user?.name}</h2>
          <p className="text-muted-foreground">Select a mode to begin your review.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setLocation("/stats")}>View Stats</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Standard Game Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="text-primary h-5 w-5" />
                Standard Review
              </CardTitle>
              <CardDescription>
                Practice by subject with 10 lives. 3 sets of questions per subject.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(SUBJECTS)[0]} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start mb-4">
                  {Object.keys(SUBJECTS).map((sub) => (
                    <TabsTrigger 
                      key={sub} 
                      value={sub}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border"
                    >
                      {sub.split(" ")[0]}...
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.keys(SUBJECTS).map((sub) => (
                  <TabsContent key={sub} value={sub} className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h3 className="font-serif font-semibold text-lg mb-2">{sub}</h3>
                      <p className="text-sm text-muted-foreground mb-4">Weight: {SUBJECTS[sub as keyof typeof SUBJECTS]}%</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map((set) => (
                          <Button 
                            key={set} 
                            variant="outline" 
                            className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5"
                            onClick={() => handleStartStandard(sub, set)}
                          >
                            <span className="text-lg font-bold">Set {set}</span>
                            <Play className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Mock Board Section */}
        <div className="space-y-6">
          <Card className="border-secondary/50 bg-secondary/5 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Shield className="h-32 w-32" />
             </div>
            <CardHeader>
              <CardTitle className="text-secondary-foreground font-display text-2xl">Mock Board Exam</CardTitle>
              <CardDescription className="text-secondary-foreground/80">
                Simulate the actual Licensure Examination for Librarians (LEL).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  All Competencies Covered
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  500 Minutes Time Limit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Passing Rate: 75%
                </li>
              </ul>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                Note: This mode is only available on desktop devices to simulate the actual exam environment.
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                size="lg"
                onClick={handleStartMock}
              >
                <Lock className="mr-2 h-4 w-4" />
                Enter Mock Board
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic text-muted-foreground">
                "Cataloging is the art of creating order out of chaos. Don't rush the details."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={mockPasscodeOpen} onOpenChange={setMockPasscodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mock Board Access</DialogTitle>
            <DialogDescription>
              Enter your examination credentials to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input 
                value={mockCreds.user} 
                onChange={(e) => setMockCreds(prev => ({ ...prev, user: e.target.value }))}
                placeholder="Ex: 123"
              />
            </div>
            <div className="space-y-2">
              <Label>Passcode</Label>
              <Input 
                type="password"
                value={mockCreds.pass} 
                onChange={(e) => setMockCreds(prev => ({ ...prev, pass: e.target.value }))}
                placeholder="Ex: 123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmMockStart}>Begin Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
