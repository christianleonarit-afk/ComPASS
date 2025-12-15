import { useState } from "react";
import { useGame } from "@/components/GameContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SUBJECTS } from "@/lib/types";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { addQuestion } = useGame();
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

  const handleImport = () => {
    // Mock import logic
    toast({
      title: "Importing...",
      description: "Parsing document and adding questions to database.",
    });
    setTimeout(() => {
       toast({
        title: "Success",
        description: "Imported 24 questions from uploaded file.",
      });
    }, 1500);
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
    </div>
  );
}
