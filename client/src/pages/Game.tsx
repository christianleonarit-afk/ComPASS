import React, { useState, useEffect } from "react";
import { useGame } from "@/components/GameContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, HelpCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Game() {
  const { 
    currentQuestions, 
    currentQuestionIndex, 
    lives, 
    score, 
    submitAnswer, 
    gameActive,
    useLifeline,
    lifelineActive,
    lifelineAvailable,
    consecutiveCorrect,
    endGame
  } = useGame();
  
  const [, setLocation] = useLocation();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    if (!gameActive) {
      setLocation("/dashboard");
    }
  }, [gameActive, setLocation]);

  const handleExit = () => {
    endGame();
    setLocation("/dashboard");
  };

  const currentQuestion = currentQuestions[currentQuestionIndex];

  if (!currentQuestion) return <div>Loading...</div>;

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    // Small delay to show result before moving
    setTimeout(() => {
      submitAnswer(index);
      setSelectedOption(null);
      setIsAnswered(false);
    }, 1000);
  };

  // 50/50 Logic: Hide 2 wrong answers when lifeline is active
  const hiddenOptions = new Set<number>();
  if (lifelineActive) {
    let hiddenCount = 0;
    const wrongIndices = currentQuestion.options
      .map((_: string, idx: number) => idx)
      .filter((idx: number) => idx !== currentQuestion.correctAnswer);

    // Randomly pick 2 wrong to hide
    while (hiddenCount < 2 && wrongIndices.length > 0) {
      const rand = Math.floor(Math.random() * wrongIndices.length);
      hiddenOptions.add(wrongIndices[rand]);
      wrongIndices.splice(rand, 1);
      hiddenCount++;
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header Stats */}
      <div className="flex gap-4 items-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Quit Game?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to return to the menu? Your current progress will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExit}>Quit Game</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex-1 flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="flex items-center gap-2 text-red-500">
            <Heart className="fill-current h-6 w-6" />
            <span className="font-bold text-xl">{lives}</span>
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Question</span>
            <p className="font-bold text-xl">{currentQuestionIndex + 1} <span className="text-muted-foreground text-base">/ {currentQuestions.length}</span></p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Score</span>
            <p className="font-bold text-xl text-primary">{score}</p>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-primary/20 shadow-xl">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                {currentQuestion.subject}
              </div>
              <h2 className="text-2xl font-serif font-medium leading-relaxed">
                {currentQuestion.text}
              </h2>
            </CardHeader>
            <CardContent className="pt-8 space-y-4">
              {currentQuestion.options.map((option: string, idx: number) => (
                <Button
                  key={idx}
                  variant={
                    isAnswered 
                      ? idx === currentQuestion.correctAnswer 
                        ? "default" // Show correct green (if default is primary/greenish) - actually default is primary blue.
                        : idx === selectedOption 
                          ? "destructive" 
                          : "outline"
                      : "outline"
                  }
                  className={`w-full justify-start text-left h-auto py-4 text-base relative ${
                    isAnswered && idx === currentQuestion.correctAnswer ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""
                  } ${
                     hiddenOptions.has(idx) ? "invisible pointer-events-none" : ""
                  }`}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered || hiddenOptions.has(idx)}
                >
                  <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center mr-4 text-sm font-bold opacity-50">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </Button>
              ))}
            </CardContent>
            <CardFooter className="bg-muted/30 flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={useLifeline}
                disabled={!(lifelineAvailable && !lifelineActive)}
                className={!(lifelineAvailable && !lifelineActive) ? "opacity-50" : ""}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {lifelineActive ? "50/50 Active" : lifelineAvailable ? "50/50 Available" : "50/50 (Locked)"}
              </Button>
              <div className="text-xs text-muted-foreground">
                Set {currentQuestion.set}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
