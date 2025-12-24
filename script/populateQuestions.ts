import fs from "fs";
import path from "path";
import { questionStorage } from "../server/questionStorage";

async function populateQuestions() {
  const questionsFile = path.join(process.cwd(), "server/data/questions.json");

  try {
    const data = fs.readFileSync(questionsFile, "utf-8");
    const questions = JSON.parse(data);

    console.log(`Loading ${questions.length} questions...`);

    for (const question of questions) {
      try {
        await questionStorage.create({
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          subject: question.subject,
          set: question.set || 1,
        });
        console.log(`Created question: ${question.id}`);
      } catch (error) {
        console.error(`Failed to create question ${question.id}:`, error);
      }
    }

    console.log("All questions loaded successfully!");
  } catch (error) {
    console.error("Error loading questions:", error);
  }
}

populateQuestions();
