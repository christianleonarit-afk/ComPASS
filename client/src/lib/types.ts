export type Subject = 
  | "Library Organization and Management"
  | "Reference, Bibliography and User Services"
  | "Cataloging and Classification"
  | "Indexing and Abstracting"
  | "Selection and Acquisition"
  | "Information Technology";

export const SUBJECTS: Record<Subject, number> = {
  "Library Organization and Management": 20,
  "Reference, Bibliography and User Services": 20,
  "Cataloging and Classification": 20,
  "Indexing and Abstracting": 15,
  "Selection and Acquisition": 15,
  "Information Technology": 10,
};

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  subject: Subject;
  set: 1 | 2 | 3;
}

export interface UserState {
  role: "student" | "librarian" | "admin" | null;
  name: string;
  lives: number;
  lifelineAvailable: boolean;
  correctStreak: number;
  completedSets: string[]; // "subject-set"
  mockBoardScore: number | null;
  standardGameScores: number[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  role: "student" | "librarian";
}
