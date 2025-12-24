import { db } from "./db";
import { rooms, questions } from "../shared/schema";
import { eq } from "drizzle-orm";

export type Room = {
  id: string;
  name: string;
  password: string;
  questionIds: string[];
  createdAt?: number;
};

export class RoomStorage {
  async create(payload: Omit<Room, "id" | "createdAt">): Promise<Room> {
    if (db) {
      const id = crypto.randomUUID();
      const [row] = await db.insert(rooms).values({
        id,
        name: payload.name,
        password: payload.password,
        question_ids: payload.questionIds,
      }).returning();
      return {
        id: row.id,
        name: row.name,
        password: row.password,
        questionIds: row.question_ids,
      };
    }

    // Fallback for file-based storage if needed
    throw new Error("Database not available");
  }

  async get(id: string): Promise<Room | undefined> {
    if (db) {
      const rows = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
      const r = rows[0];
      if (!r) return undefined;
      return {
        id: r.id,
        name: r.name,
        password: r.password,
        questionIds: r.question_ids,
      };
    }
    throw new Error("Database not available");
  }

  async list(): Promise<Room[]> {
    if (db) {
      const rows = await db.select().from(rooms);
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        password: r.password,
        questionIds: r.question_ids,
      }));
    }
    throw new Error("Database not available");
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
    if (db) {
      const rows = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
      const r = rows[0];
      return r ? r.password === password : false;
    }
    throw new Error("Database not available");
  }

  async update(id: string, payload: Partial<Omit<Room, "id" | "createdAt">>): Promise<Room | undefined> {
    if (db) {
      const updateData: any = {};
      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.password !== undefined) updateData.password = payload.password;
      if (payload.questionIds !== undefined) updateData.question_ids = payload.questionIds;

      const [row] = await db.update(rooms).set(updateData).where(eq(rooms.id, id)).returning();
      if (!row) return undefined;

      return {
        id: row.id,
        name: row.name,
        password: row.password,
        questionIds: row.question_ids,
      };
    }
    throw new Error("Database not available");
  }

  async delete(id: string): Promise<boolean> {
    if (db) {
      // First get the room to find associated question IDs
      const roomRows = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
      const room = roomRows[0];

      if (room) {
        // Delete associated questions (only mockboard questions)
        const questionIds = room.question_ids;
        if (questionIds && questionIds.length > 0) {
          await db.delete(questions).where(eq(questions.category, "mockboard"));
        }
      }

      // Delete the room
      const res = await db.delete(rooms).where(eq(rooms.id, id)).returning();
      return res.length > 0;
    }
    throw new Error("Database not available");
  }
}

export const roomStorage = new RoomStorage();
