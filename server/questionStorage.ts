import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "./db";
import { questions, mockboardQuestions } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject?: string;
  set?: string | number;
  category?: string;
};

const dataDir = path.resolve(import.meta.dirname, "data");
const dataFile = path.join(dataDir, "questions.json");

async function ensureDataFile() {
  try {
    await fs.promises.mkdir(dataDir, { recursive: true });
    if (!(await fs.promises.stat(dataFile).catch(() => false))) {
      await fs.promises.writeFile(dataFile, JSON.stringify([]), "utf-8");
    }
  } catch (e) {
    // ignore for now — callers will surface errors
  }
}

async function readAll(): Promise<Question[]> {
  await ensureDataFile();
  const raw = await fs.promises.readFile(dataFile, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Question[];
    return [];
  } catch (e) {
    return [];
  }
}

async function writeAll(items: Question[]) {
  await ensureDataFile();
  await fs.promises.writeFile(dataFile, JSON.stringify(items, null, 2), "utf-8");
}

export class QuestionStorage {
  async list(category?: string): Promise<Question[]> {
    if (db) {
      let query = db.select().from(questions);
      if (category) {
        query = query.where(eq(questions.category, category));
      }
      const rows = await query;
      return rows.map((r: any) => ({
        id: r.id,
        text: r.text,
        options: r.options,
        correctAnswer: r.correct_answer,
        subject: r.subject,
        set: r.set,
        category: r.category,
      }));
    }
    const all = await readAll();
    if (category) {
      return all.filter(q => (q as any).category === category);
    }
    return all;
  }

  async get(id: string): Promise<Question | undefined> {
    if (db) {
      const rows = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
      const r = rows[0];
      if (!r) return undefined;
      return {
        id: r.id,
        text: r.text,
        options: r.options,
        correctAnswer: r.correct_answer,
        subject: r.subject,
        set: r.set,
        category: r.category
      };
    }
    const all = await readAll();
    return all.find((q) => q.id === id);
  }

  async getBulk(ids: string[]): Promise<Question[]> {
    if (db) {
      const rows = await db.select().from(questions).where(inArray(questions.id, ids));
      return rows.map((r: any) => ({
        id: r.id,
        text: r.text,
        options: r.options,
        correctAnswer: r.correct_answer,
        subject: r.subject,
        set: r.set,
        category: r.category
      }));
    }
    const all = await readAll();
    return all.filter((q) => ids.includes(q.id));
  }

  async getBulkMockboard(ids: string[]): Promise<Question[]> {
    if (db) {
      const rows = await db.select().from(mockboardQuestions).where(inArray(mockboardQuestions.id, ids));
      // Create a map for quick lookup
      const questionMap = new Map(rows.map((r: any) => [r.id, {
        id: r.id,
        text: r.text,
        options: r.options,
        correctAnswer: r.correct_answer,
        subject: r.subject,
        set: r.set,
        category: 'mockboard'
      }]));
      // Return questions in the same order as the ids array
      return ids.map(id => questionMap.get(id)).filter(Boolean) as Question[];
    }
    // Fallback for file-based storage (not applicable for mockboard)
    return [];
  }

  async create(payload: Omit<Question, "id">): Promise<Question> {
    if (db) {
      const id = randomUUID();
      const [row] = await db.insert(questions).values({
        id,
        text: payload.text,
        options: payload.options,
        correct_answer: payload.correctAnswer,
        subject: payload.subject,
        set: payload.set as any,
        category: payload.category,
      }).returning();
      return {
        id: row.id,
        text: row.text,
        options: row.options,
        correctAnswer: row.correct_answer,
        subject: row.subject,
        set: row.set,
        category: row.category
      };
    }

    const all = await readAll();
    const q: Question = { ...payload, id: randomUUID() };
    all.push(q);
    await writeAll(all);
    return q;
  }

  async update(id: string, patch: Partial<Omit<Question, "id">>): Promise<Question | undefined> {
    if (db) {
      const [row] = await db.update(questions).set({
        ...(patch.text ? { text: patch.text } : {}),
        ...(typeof patch.options !== "undefined" ? { options: patch.options } : {}),
        ...(typeof patch.correctAnswer !== "undefined" ? { correct_answer: patch.correctAnswer } : {}),
        ...(typeof patch.subject !== "undefined" ? { subject: patch.subject } : {}),
        ...(typeof patch.set !== "undefined" ? { set: patch.set as any } : {}),
      }).where(eq(questions.id, id)).returning();
      if (!row) return undefined;
      return { id: row.id, text: row.text, options: row.options, correctAnswer: row.correct_answer, subject: row.subject, set: row.set };
    }

    const all = await readAll();
    const idx = all.findIndex((q) => q.id === id);
    if (idx === -1) return undefined;
    const updated = { ...all[idx], ...patch };
    all[idx] = updated;
    await writeAll(all);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (db) {
      const res = await db.delete(questions).where(eq(questions.id, id)).returning();
      return res.length > 0;
    }
    const all = await readAll();
    const idx = all.findIndex((q) => q.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await writeAll(all);
    return true;
  }
}

export const questionStorage = new QuestionStorage();
