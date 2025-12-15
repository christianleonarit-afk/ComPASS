import { Question, Subject } from "./types";

const generateQuestions = (subject: Subject, count: number): Question[] => {
  const questions: Question[] = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: `${subject.substring(0, 3)}-${i}`,
      text: `Sample question #${i} about ${subject}. What is the correct principle?`,
      options: [
        `Correct Answer for ${i}`,
        `Distractor A for ${i}`,
        `Distractor B for ${i}`,
        `Distractor C for ${i}`,
      ],
      correctAnswer: 0, // Simplified for mock data generation, we shuffle in UI
      subject: subject,
      set: (i % 3 + 1) as 1 | 2 | 3,
    });
  }
  return questions;
};

// Hand-crafted sample questions for realism
const realQuestions: Question[] = [
  {
    id: "LOM-1",
    text: "Which of the following management theories emphasizes the importance of human relations and employee satisfaction?",
    options: ["Scientific Management", "Human Relations Theory", "Bureaucratic Theory", "Systems Theory"],
    correctAnswer: 1,
    subject: "Library Organization and Management",
    set: 1
  },
  {
    id: "CAT-1",
    text: "In the Dewey Decimal Classification system, what does the 020 class represent?",
    options: ["Philosophy & Psychology", "Social Sciences", "Library & Information Sciences", "General Works"],
    correctAnswer: 2,
    subject: "Cataloging and Classification",
    set: 1
  },
  {
    id: "REF-1",
    text: "Which type of reference source provides a concise overview of a specific subject?",
    options: ["Directory", "Encyclopedia", "Almanac", "Yearbook"],
    correctAnswer: 1,
    subject: "Reference, Bibliography and User Services",
    set: 1
  },
  {
    id: "IT-1",
    text: "What is the standard protocol used for retrieving emails from a server?",
    options: ["SMTP", "FTP", "IMAP", "HTTP"],
    correctAnswer: 2,
    subject: "Information Technology",
    set: 1
  },
  {
    id: "IDX-1",
    text: "Which type of abstract is critical and evaluative?",
    options: ["Informative Abstract", "Indicative Abstract", "Critical Abstract", "Structured Abstract"],
    correctAnswer: 2,
    subject: "Indexing and Abstracting",
    set: 1
  },
  {
    id: "ACQ-1",
    text: "What is the first step in the acquisition process?",
    options: ["Ordering", "Selection", "Receiving", "Processing"],
    correctAnswer: 1,
    subject: "Selection and Acquisition",
    set: 1
  }
];

export const MOCK_QUESTIONS: Question[] = [
  ...realQuestions,
  ...generateQuestions("Library Organization and Management", 15),
  ...generateQuestions("Reference, Bibliography and User Services", 15),
  ...generateQuestions("Cataloging and Classification", 15),
  ...generateQuestions("Indexing and Abstracting", 15),
  ...generateQuestions("Selection and Acquisition", 15),
  ...generateQuestions("Information Technology", 15),
];

export const getQuestionsBySubject = (subject: Subject) => MOCK_QUESTIONS.filter(q => q.subject === subject);
export const getQuestionsBySet = (set: number) => MOCK_QUESTIONS.filter(q => q.set === set);

export const LEADERBOARD_DATA = [
  { id: "1", name: "Alice Librarian", score: 98, role: "student" },
  { id: "2", name: "Bob Cataloger", score: 95, role: "librarian" },
  { id: "3", name: "Charlie IT", score: 92, role: "student" },
  { id: "4", name: "Diana Ref", score: 88, role: "student" },
  { id: "5", name: "Evan Admin", score: 85, role: "admin" },
] as const;
