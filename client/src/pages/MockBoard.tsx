import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useGame } from "@/components/GameContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, AlertTriangle, CheckCircle, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const MockBoard = memo(function MockBoard() {
  const {
    currentQuestions,
    lives, // Not used in mock but good to verify
    timeLeft,
    gameActive,
    endGame,
    mockResults,
    submitMockExam
  } = useGame();

  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Record<number, number>>({}); // qIndex -> optionIndex
  const [localResults, setLocalResults] = useState<{ score: number, passed: boolean, correctCount: number, total: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Use context results if available, otherwise fall back to local calculation
  const results = mockResults || localResults;

  // Pagination settings - optimized for performance
  const QUESTIONS_PER_PAGE = 20;
  const totalPages = Math.ceil(currentQuestions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, currentQuestions.length);

  // Memoize current page questions to prevent unnecessary re-renders
  const currentPageQuestions = useMemo(() =>
    currentQuestions.slice(startIndex, endIndex),
    [currentQuestions, startIndex, endIndex]
  );

  // Track answered questions for progress
  const answeredCount = useMemo(() =>
    Object.keys(answers).length,
    [answers]
  );

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    if (!gameActive && !mockResults) {
      setLocation("/dashboard");
    }
  }, [gameActive, mockResults, setLocation]);

  const handleSelect = useCallback((qIndex: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  }, []);

  const handleSubmitExam = useCallback(() => {
    console.log('Submitting exam with answers:', answers);
    console.log('Total questions:', currentQuestions.length);

    // Use the context's submitMockExam method which properly calculates everything
    submitMockExam(answers);
  }, [currentQuestions, answers, submitMockExam]);

  if (results && 'subjectScores' in results) {
    const contextResults = results as any;
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-muted">
               {contextResults.passed ? <span className="text-6xl">🎉</span> : <span className="text-6xl">⚠️</span>}
            </div>
            <CardTitle className="text-3xl font-display">{contextResults.passed ? "PASSED" : "FAILED"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground uppercase">Final Score</p>
                <p className="text-4xl font-bold text-primary">{contextResults.score.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground uppercase">Overall</p>
                <p className="text-2xl font-bold">{contextResults.passed ? "PASSED" : "FAILED"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Subject-wise Performance</h3>
              {Object.entries(contextResults.subjectScores).map(([subject, scores]: [string, any]) => {
                // Calculate grade based on percentage
                let grade = '';
                let gradeColor = '';
                if (scores.percentage >= 90) {
                  grade = 'A (Excellent)';
                  gradeColor = 'text-green-600';
                } else if (scores.percentage >= 80) {
                  grade = 'B (Very Good)';
                  gradeColor = 'text-blue-600';
                } else if (scores.percentage >= 70) {
                  grade = 'C (Good)';
                  gradeColor = 'text-yellow-600';
                } else if (scores.percentage >= 60) {
                  grade = 'D (Satisfactory)';
                  gradeColor = 'text-orange-600';
                } else {
                  grade = 'F (Needs Improvement)';
                  gradeColor = 'text-red-600';
                }

                return (
                  <div key={subject} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{subject}</span>
                      <span className={`font-bold text-lg ${gradeColor}`}>{grade}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Score: {scores.correct}/{scores.total}</span>
                      <span className="font-semibold">{scores.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-muted-foreground text-center">
              {contextResults.passed
                ? "Congratulations! You have demonstrated proficiency in the required competencies."
                : "You did not meet the passing threshold of 75%. Keep reviewing!"}
            </p>

            <Button className="w-full" onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (localResults) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <Card className="w-full max-w-lg shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-muted">
               {localResults.passed ? <span className="text-6xl">🎉</span> : <span className="text-6xl">⚠️</span>}
            </div>
            <CardTitle className="text-3xl font-display">{localResults.passed ? "PASSED" : "FAILED"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground uppercase">Score</p>
                <p className="text-4xl font-bold text-primary">{localResults.score.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground uppercase">Correct</p>
                <p className="text-4xl font-bold">{localResults.correctCount}/{localResults.total}</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              {localResults.passed
                ? "Congratulations! You have demonstrated proficiency in the required competencies."
                : "You did not meet the passing threshold of 75%. Keep reviewing!"}
            </p>

            <Button className="w-full" onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Sticky Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer className="text-destructive animate-pulse" />
            <span className="font-mono text-xl font-bold">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium">{answeredCount}/{currentQuestions.length} answered</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Mock Board Examination</div>
          <div className="w-32 h-2 bg-muted rounded-full mt-1">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / currentQuestions.length) * 100}%` }}
            />
          </div>
        </div>
        <Button size="sm" onClick={handleSubmitExam} disabled={answeredCount === 0}>
          Submit Exam
        </Button>
      </div>

      {/* Progress and Pagination */}
      <div className="px-6 py-3 bg-muted/50 border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Question {startIndex + 1}-{endIndex} of {currentQuestions.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Question List - Paginated */}
        <ScrollArea className="h-full p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {currentPageQuestions.map((q, pageIdx) => {
              const globalIdx = startIndex + pageIdx;
              return (
                <Card key={q.id} className="border-l-4 border-l-primary/50">
                  <CardHeader className="pb-2">
                     <div className="flex justify-between">
                       <span className="text-xs font-bold text-muted-foreground">Question {globalIdx + 1}</span>
                       <span className="text-xs text-muted-foreground">{q.subject}</span>
                     </div>
                     <h3 className="text-lg font-medium mt-2">{q.text}</h3>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      onValueChange={(val) => handleSelect(globalIdx, parseInt(val))}
                      value={answers[globalIdx]?.toString()}
                    >
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value={optIdx.toString()} id={`q${globalIdx}-opt${optIdx}`} />
                          <Label htmlFor={`q${globalIdx}-opt${optIdx}`} className="font-normal cursor-pointer w-full">
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

export default MockBoard;
