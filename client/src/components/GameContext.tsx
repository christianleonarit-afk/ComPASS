import React, { createContext, useContext, useState, useEffect } from "react";
import { UserState, Question, SUBJECTS } from "../lib/types";
import { MOCK_QUESTIONS } from "../lib/data";
import { useToast } from "@/hooks/use-toast";

interface GameContextType {
  user: UserState | null;
  login: (role: "student" | "librarian" | "admin", name: string) => void;
  logout: () => void;
  lives: number;
  score: number;
  currentQuestionIndex: number;
  currentQuestions: Question[];
  gameMode: "standard" | "mock" | null;
  gameActive: boolean;
  startGame: (mode: "standard" | "mock", subject?: string, set?: number) => void;
  submitAnswer: (answerIndex: number) => void;
  useLifeline: () => void;
  endGame: () => void;
  resetStats: () => void;
  timeLeft: number; // in seconds
  lifelineUsed: boolean;
  addQuestion: (q: Question) => void;
  mockResults: { score: number; passed: boolean; details: Record<string, number> } | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<UserState | null>(null);
  
  // Game State
  const [gameMode, setGameMode] = useState<"standard" | "mock" | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [mockResults, setMockResults] = useState<{ score: number; passed: boolean; details: Record<string, number> } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  const login = (role: "student" | "librarian" | "admin", name: string) => {
    setUser({
      role,
      name,
      lives: 10,
      lifelineAvailable: false,
      correctStreak: 0,
      completedSets: [],
      mockBoardScore: null,
      standardGameScores: [],
    });
  };

  const logout = () => {
    setUser(null);
    setGameActive(false);
    setGameMode(null);
  };

  const startGame = (mode: "standard" | "mock", subject?: string, set?: number) => {
    setGameMode(mode);
    setScore(0);
    setCurrentQuestionIndex(0);
    setLifelineUsed(false);
    setConsecutiveCorrect(0);
    setMockResults(null);
    
    if (mode === "standard") {
      setLives(10);
      setTimeLeft(0); 
      
      let questions = [...MOCK_QUESTIONS];
      if (subject) {
        questions = questions.filter(q => q.subject === subject);
      }
      if (set) {
        questions = questions.filter(q => q.set === set);
      }
      setCurrentQuestions(questions.sort(() => Math.random() - 0.5));
    } else {
      setLives(999); 
      setTimeLeft(500 * 60);
      setCurrentQuestions(MOCK_QUESTIONS.sort(() => Math.random() - 0.5).slice(0, 100)); 
    }
    
    setGameActive(true);
  };

  const submitAnswer = (answerIndex: number) => {
    if (!gameActive) return;

    const currentQ = currentQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQ.correctAnswer;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setConsecutiveCorrect(prev => prev + 1);
      
      if (gameMode === "standard") {
        if (consecutiveCorrect + 1 === 5) {
          toast({
            title: "Lifeline Unlocked!",
            description: "You've answered 5 correctly in a row. 50/50 is now available.",
          });
        }
      }
    } else {
      setConsecutiveCorrect(0);
      if (gameMode === "standard") {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            endGame();
          }
          return newLives;
        });
        toast({
          variant: "destructive",
          title: "Wrong Answer!",
          description: "You lost a heart.",
        });
      }
    }

    if (currentQuestionIndex < currentQuestions.length - 1 && (gameMode === "mock" || lives > 0)) {
      setCurrentQuestionIndex(prev => prev + 1);
      setLifelineUsed(false); 
    } else {
      endGame();
    }
  };

  const useLifeline = () => {
    if (consecutiveCorrect >= 5 && !lifelineUsed) {
      setLifelineUsed(true);
      setConsecutiveCorrect(0); 
    }
  };

  const endGame = () => {
    setGameActive(false);
    
    if (gameMode === "mock") {
      const percentage = (score / currentQuestions.length) * 100;
      const passed = percentage >= 75;
      
      const details: Record<string, number> = {};
      
      setMockResults({
        score: percentage,
        passed,
        details
      });

      if (user) {
        setUser({
          ...user,
          mockBoardScore: percentage
        });
      }
    } else {
       if (user) {
        setUser({
          ...user,
          standardGameScores: [...user.standardGameScores, score]
        });
      }
    }
  };

  const resetStats = () => {
     if (user) {
        setUser({
          ...user,
          lives: 10,
          standardGameScores: [],
          mockBoardScore: null
        });
      }
  };

  const addQuestion = (q: Question) => {
    MOCK_QUESTIONS.push(q);
    toast({ title: "Question Added", description: "Successfully added to the database." });
  };

  return (
    <GameContext.Provider
      value={{
        user,
        login,
        logout,
        lives,
        score,
        currentQuestionIndex,
        currentQuestions,
        gameMode,
        gameActive,
        startGame,
        submitAnswer,
        useLifeline,
        endGame,
        resetStats,
        timeLeft,
        lifelineUsed,
        addQuestion,
        mockResults
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
