import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "./db";
import { exams } from "@shared/schema";
import { eq } from "drizzle-orm";

export type Exam = {
  id: string;
  title: string;
  questionIds: string[];
  durationMinutes?: number;
  createdAt?: string;
};

const dataDir = path.resolve(import.meta.dirname, "data");
const dataFile = path.join(dataDir, "exams.json");

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

async function readAll(): Promise<Exam[]> {
  await ensureDataFile();
  const raw = await fs.promises.readFile(dataFile, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Exam[];
    return [];
  } catch (e) {
    return [];
  }
}

async function writeAll(items: Exam[]) {
  await ensureDataFile();
  await fs.promises.writeFile(dataFile, JSON.stringify(items, null, 2), "utf-8");
}

export class ExamStorage {
  async list(): Promise<Exam[]> {
    if (db) {
      const rows = await db.select().from(exams);
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        questionIds: r.question_ids,
        durationMinutes: r.duration_minutes,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      }));
    }
    return readAll();
  }

  async get(id: string): Promise<Exam | undefined> {
    if (db) {
      const rows = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
      const r = rows[0];
      if (!r) return undefined;
      return { id: r.id, title: r.title, questionIds: r.question_ids, durationMinutes: r.duration_minutes, createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined };
    }
    const all = await readAll();
    return all.find((q) => q.id === id);
  }

  async create(payload: Omit<Exam, "id" | "createdAt">): Promise<Exam> {
    if (db) {
      const id = randomUUID();
      const [row] = await db.insert(exams).values({
        id,
        title: payload.title,
        question_ids: payload.questionIds,
        duration_minutes: payload.durationMinutes as any,
      }).returning();
      return { id: row.id, title: row.title, questionIds: row.question_ids, durationMinutes: row.duration_minutes, createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined };
    }

    const all = await readAll();
    const e: Exam = { ...payload, id: randomUUID(), createdAt: new Date().toISOString() };
    all.push(e);
    await writeAll(all);
    return e;
  }

  async update(id: string, patch: Partial<Omit<Exam, "id" | "createdAt">>): Promise<Exam | undefined> {
    if (db) {
      const [row] = await db.update(exams).set({
        ...(patch.title ? { title: patch.title } : {}),
        ...(typeof patch.questionIds !== "undefined" ? { question_ids: patch.questionIds } : {}),
        ...(typeof patch.durationMinutes !== "undefined" ? { duration_minutes: patch.durationMinutes as any } : {}),
      }).where(eq(exams.id, id)).returning();
      if (!row) return undefined;
      return { id: row.id, title: row.title, questionIds: row.question_ids, durationMinutes: row.duration_minutes, createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined };
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
      const res = await db.delete(exams).where(eq(exams.id, id)).returning();
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

export const examStorage = new ExamStorage();
