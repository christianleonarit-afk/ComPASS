import { db } from "../server/db";
import { questions } from "../shared/schema";
import { eq } from "drizzle-orm";

async function deleteMockBoardQuestions() {
  try {
    console.log("Deleting all mock board questions...");

    const result = await db.delete(questions).where(eq(questions.category, "mockboard"));

    console.log(`Successfully deleted ${result.rowsAffected || 0} mock board questions`);
  } catch (error) {
    console.error("Error deleting mock board questions:", error);
  } finally {
    process.exit(0);
  }
}

deleteMockBoardQuestions();
