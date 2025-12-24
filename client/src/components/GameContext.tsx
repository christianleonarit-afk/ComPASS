import React, { createContext, useContext, useState, useEffect } from "react";
import { UserState, Question, SUBJECTS } from "../lib/types";
import { MOCK_QUESTIONS } from "../lib/data";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mockboardQuestions } from "../../../shared/schema";

// Configuration constants
const MAX_QUESTIONS = 100;
const MOCKBOARD_MAX_QUESTIONS = 650; // Maximum questions for mockboard exam
const INITIAL_LIVES = 10;
const LIFELINE_THRESHOLD = 5;

// Utility: shuffle and pick the first MAX_QUESTIONS
const pickQuestions = (questions: Question[]) => questions.sort(() => Math.random() - 0.5).slice(0, MAX_QUESTIONS);

// Utility: select questions with proper LIS subject distribution for mockboard
const selectMockboardQuestions = (questions: Question[]): Question[] => {
  const selectedQuestions: Question[] = [];

  // LIS Standards target distribution (scaled to 650 questions)
  const targetDistribution = {
    "Library Organization and Management": 130, // 20% of 650
    "Reference, Bibliography and User Services": 130, // 20% of 650
    "Cataloging and Classification": 130, // 20% of 650
    "Indexing and Abstracting": 98, // 15% of 650 (rounded)
    "Selection and Acquisition": 98, // 15% of 650 (rounded)
    "Information Technology": 65, // 10% of 650
  };

  // Group questions by subject
  const questionsBySubject: Record<string, Question[]> = {};
  questions.forEach(q => {
    if (!questionsBySubject[q.subject]) {
      questionsBySubject[q.subject] = [];
    }
    questionsBySubject[q.subject].push(q);
  });

  // Select questions for each subject according to target distribution
  Object.entries(targetDistribution).forEach(([subject, targetCount]) => {
    const availableQuestions = questionsBySubject[subject] || [];
    const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, targetCount);
    selectedQuestions.push(...selected);
  });

  // If we don't have enough questions, fill with random questions from available subjects
  if (selectedQuestions.length < MOCKBOARD_MAX_QUESTIONS) {
    const remainingNeeded = MOCKBOARD_MAX_QUESTIONS - selectedQuestions.length;
    const allRemainingQuestions = questions.filter(q => !selectedQuestions.includes(q));
    const shuffledRemaining = allRemainingQuestions.sort(() => Math.random() - 0.5);
    selectedQuestions.push(...shuffledRemaining.slice(0, remainingNeeded));
  }

  // Shuffle the final selection to mix subjects
  return selectedQuestions.sort(() => Math.random() - 0.5);
};

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
  startGame: (mode: "standard" | "mock", subject?: string, set?: number, customQuestions?: Question[]) => void;
  submitAnswer: (answerIndex: number) => void;
  useLifeline: () => boolean;
  endGame: () => void;
  resetStats: () => void;
  timeLeft: number; // in seconds
  lifelineActive: boolean; // active for current question
  lifelineAvailable: boolean; // unlocked and available to use
  consecutiveCorrect: number;
  addQuestion: (q: Question) => void;
  importQuestions: (questions: Question[]) => void;
  mockResults: { score: number; passed: boolean; details: Record<string, number>; subjectScores?: Record<string, {correct: number, total: number, percentage: number}> } | null;
  submitMockExam: (answers: Record<number, number>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user from localStorage on mount
  const [user, setUser] = useState<UserState | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Fetch questions from API
  const { data: apiQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/questions');
        if (!response.ok) throw new Error('Failed to fetch questions');
        return await response.json();
      } catch (error) {
        console.warn('API not available, using fallback questions:', error);
        return MOCK_QUESTIONS;
      }
    },
  });

  // Fetch mockboard questions from database
  const { data: mockboardQuestions = [], isLoading: mockboardQuestionsLoading } = useQuery({
    queryKey: ['mockboard-questions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/mockboard-questions');
        if (!response.ok) throw new Error('Failed to fetch mockboard questions');
        const questions = await response.json();
        // Convert from database format to Question format and sort by imported_at to maintain file order
        return questions
          .map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correct_answer,
            subject: q.subject,
            set: q.set,
            imported_at: q.imported_at, // Keep for sorting
          }))
          .sort((a: any, b: any) => {
            // Sort by imported_at timestamp to maintain original file order
            const aTime = new Date(a.imported_at || 0).getTime();
            const bTime = new Date(b.imported_at || 0).getTime();
            return aTime - bTime; // Ascending order (earliest first)
          })
          .map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            subject: q.subject,
            set: q.set,
          })); // Remove imported_at from final objects
      } catch (error) {
        console.warn('Mockboard questions API not available:', error);
        return [];
      }
    },
  });
  
  // Game State
  const [gameMode, setGameMode] = useState<"standard" | "mock" | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lifelineActive, setLifelineActive] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [questionResults, setQuestionResults] = useState<boolean[]>([]); // Track correct/incorrect per question
  const [mockResults, setMockResults] = useState<{ score: number; passed: boolean; details: Record<string, number>; subjectScores: Record<string, {correct: number, total: number, percentage: number}> } | null>(null);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev: number) => {
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
    localStorage.removeItem('user');
  };

  const startGame = (mode: "standard" | "mock", subject?: string, set?: number, customQuestions?: Question[]) => {
    setGameMode(mode);
    setScore(0);
    setCurrentQuestionIndex(0);
    setLifelineActive(false);
    setConsecutiveCorrect(0);
    setMockResults(null);

    if (mode === "standard") {
      setLives(INITIAL_LIVES);
      setTimeLeft(0);

      let questions = [...apiQuestions];
      if (subject) {
        questions = questions.filter(q => q.subject === subject);
      }
      if (set) {
        questions = questions.filter(q => q.set === set);
      }
      setCurrentQuestions(pickQuestions(questions));
    } else {
      // For mock board, lifeline is immediately available
      setLives(INITIAL_LIVES);
      setTimeLeft(300 * 60); // 5 hours (300 minutes) for 650 questions

      // Use custom questions if provided (for rooms), otherwise use ALL mockboard questions in order
      if (customQuestions && customQuestions.length > 0) {
        // For rooms: use the specific questions assigned to the room
        setCurrentQuestions(customQuestions);
      } else if (mockboardQuestions.length > 0) {
        // For general mockboard: use ALL imported questions in their original order
        // Limit to 650 questions max to prevent extremely long exams
        const questionsToUse = mockboardQuestions.slice(0, MOCKBOARD_MAX_QUESTIONS);
        setCurrentQuestions(questionsToUse);
      } else {
        // Fallback: use API questions with LIS distribution
        const selectedQuestions = selectMockboardQuestions(apiQuestions);
        setCurrentQuestions(selectedQuestions);
      }
    }

    setGameActive(true);
  };

  const submitAnswer = (answerIndex: number) => {
    if (!gameActive) return;

    const currentQ = currentQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQ.correctAnswer;

    // Record the result for this question
    setQuestionResults(prev => {
      const newResults = [...prev];
      newResults[currentQuestionIndex] = isCorrect;
      return newResults;
    });

    if (isCorrect) {
      setScore((prev: number) => prev + 1);
      setConsecutiveCorrect((prev: number) => {
        const next = prev + 1;
        if (next === LIFELINE_THRESHOLD) {
          toast({
            title: "Lifeline Unlocked!",
            description: `You've answered ${LIFELINE_THRESHOLD} correctly in a row. 50/50 is now available.`,
          });
        }
        return next;
      });
    } else {
      setConsecutiveCorrect(0);
      if (gameMode === "standard") {
        setLives((prev: number) => {
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
      setCurrentQuestionIndex((prev: number) => prev + 1);
      setLifelineActive(false);
    } else {
      endGame();
    }
  };

  const useLifeline = () => {
    // For mock board, lifeline is always available; for standard, needs threshold
    const isAvailable = gameMode === "mock" || consecutiveCorrect >= LIFELINE_THRESHOLD;
    if (!isAvailable || lifelineActive) return false;
    setLifelineActive(true);
    if (gameMode === "standard") {
      setConsecutiveCorrect(0);
    }
    return true;
  };

  const endGame = () => {
    setGameActive(false);

    if (gameMode === "mock") {
      const totalQuestions = currentQuestions.length;
      const overallPercentage = (score / totalQuestions) * 100;

      // Calculate subject-wise scores
      const subjectScores: Record<string, {correct: number, total: number, percentage: number}> = {};
      const subjectTracking: Record<string, {correct: number, total: number}> = {};

      // Track correct/incorrect per subject using questionResults
      currentQuestions.forEach((question, index) => {
        const subject = question.subject;
        if (!subjectTracking[subject]) {
          subjectTracking[subject] = { correct: 0, total: 0 };
        }
        subjectTracking[subject].total += 1;

        // Check if this question was answered correctly (only if it was actually answered)
        const wasAnswered = index < questionResults.length;
        const isCorrect = wasAnswered ? questionResults[index] : false;

        if (isCorrect) {
          subjectTracking[subject].correct += 1;
        }
      });

      // Calculate percentages per subject
      Object.entries(subjectTracking).forEach(([subject, stats]) => {
        subjectScores[subject] = {
          correct: stats.correct,
          total: stats.total,
          percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        };
      });

      // Calculate weighted final score using LIS standards (subject percentages)
      let weightedScore = 0;
      let totalWeight = 0;

      Object.entries(SUBJECTS).forEach(([subject, weight]) => {
        if (subjectScores[subject]) {
          // Weight is the percentage value (e.g., 20 for Library Organization)
          // Multiply subject percentage by its weight and divide by 100
          weightedScore += (subjectScores[subject].percentage * weight) / 100;
          totalWeight += weight;
        }
      });

      // The weightedScore is now the sum of (subject_percentage * subject_weight / 100)
      // Since weights total 100%, this gives us the final weighted percentage
      const finalWeightedScore = totalWeight > 0 ? weightedScore : overallPercentage;

      setMockResults({
        score: finalWeightedScore,
        passed: finalWeightedScore >= 75,
        details: {}, // Remove old details, we'll show subjectScores instead
        subjectScores
      });

      if (user) {
        setUser({
          ...user,
          mockBoardScore: finalWeightedScore
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

  const addQuestion = async (q: Question) => {
    try {
      const response = await fetch('/api/mockboard-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q)
      });

      if (!response.ok) {
        throw new Error(`Failed to add question: ${response.status}`);
      }

      toast({ title: "Question Added", description: "Successfully added to Mock Board database." });

      // Invalidate the mockboard questions query to refresh the cache
      queryClient.invalidateQueries({ queryKey: ['mockboard-questions'] });
    } catch (error) {
      console.error('Add question error:', error);
      toast({
        variant: "destructive",
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add question"
      });
    }
  };

  const importQuestions = async (questions: Question[]) => {
    try {
      const response = await fetch('/api/mockboard-questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      });

      if (!response.ok) {
        throw new Error(`Failed to import questions: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Questions Imported",
        description: `${result.count} questions added to Mock Board database.`
      });

      // Invalidate the mockboard questions query to refresh the cache
      queryClient.invalidateQueries({ queryKey: ['mockboard-questions'] });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import questions"
      });
    }
  };

  const submitMockExam = (answers: Record<number, number>) => {
    console.log('submitMockExam called with answers:', answers);

    // Calculate score and populate questionResults
    let correctCount = 0;
    const newQuestionResults: boolean[] = [];

    currentQuestions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.correctAnswer;
      newQuestionResults[idx] = isCorrect;

      if (isCorrect) {
        correctCount++;
      }
    });

    console.log(`Calculated score: ${correctCount}/${currentQuestions.length}`);

    // Set the question results and score in context state
    setQuestionResults(newQuestionResults);
    setScore(correctCount);

    // Now call endGame to calculate the detailed results
    endGame();
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
        lifelineActive,
        lifelineAvailable: gameMode === "mock" || consecutiveCorrect >= LIFELINE_THRESHOLD,
        consecutiveCorrect,
        addQuestion,
        importQuestions,
        mockResults,
        submitMockExam
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
