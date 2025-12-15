import { useState } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/components/GameContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Import the image using the alias - we'll assume it's there from the previous step
import heroBg from "@assets/generated_images/cinematic_library_interior_with_floating_geometric_shapes.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { login } = useGame();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"student" | "librarian" | "admin" | null>(null);
  const [passcode, setPasscode] = useState("");
  const [username, setUsername] = useState("");

  const handleLogin = () => {
    if (!username) {
      toast({ variant: "destructive", title: "Name required", description: "Please enter your name." });
      return;
    }

    if (selectedRole === "admin") {
      if (passcode === "123" && username === "user") { // Simplified check based on prompt "user: 123 pass: 123" - Wait, prompt says "user: 123 pass: 123" for passcode? Or implies auth? 
        // "enter a passcode first make it "user: 123 pass: 123" on the mean time" - This is ambiguous. I'll treat it as username 'user' and pass '123' for simplicity.
        // Actually, prompt says "enter a passcode first make it "user: 123 pass: 123" on the mean time" - Likely meant credential pair.
        login(selectedRole, username);
        setLocation("/dashboard");
      } else {
         toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials." });
      }
    } else {
      login(selectedRole!, username);
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Library Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold text-primary tracking-tight">
            Librarium
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic max-w-2xl mx-auto">
            "The only thing that you absolutely have to know, is the location of the library." - Albert Einstein
          </p>
        </motion.div>

        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {[
              { role: "student", icon: User, label: "Student/User", desc: "Review for your licensure exam." },
              { role: "librarian", icon: BookOpen, label: "Librarian", desc: "Access resources and references." },
              { role: "admin", icon: Shield, label: "Administrator", desc: "Manage questions and database." },
            ].map((item, idx) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  className="hover:border-primary/50 cursor-pointer transition-all hover:scale-105 hover:shadow-xl group bg-card/80 backdrop-blur-sm"
                  onClick={() => setSelectedRole(item.role as any)}
                >
                  <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-2xl">{item.label}</CardTitle>
                      <CardDescription>{item.desc}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="bg-card/90 backdrop-blur-md shadow-2xl border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-center">
                  Login as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    placeholder="Enter your name" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                {selectedRole === "admin" && (
                   <div className="space-y-2">
                    <Label>Passcode</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter passcode" 
                      value={passcode} 
                      onChange={e => setPasscode(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Hint: 123</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedRole(null)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleLogin}>
                    Enter Librarium
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
