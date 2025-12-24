import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  options: text("options", { mode: 'json' }).notNull(),
  correct_answer: integer("correct_answer").notNull(),
  subject: text("subject").notNull(),
  set: integer("set"),
  category: text("category").notNull().default("standard"), // "standard" or "mockboard"
});

export type QuestionRow = typeof questions.$inferSelect;

export const exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  question_ids: text("question_ids", { mode: 'json' }).notNull(),
  duration_minutes: integer("duration_minutes"),
  created_at: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export type ExamRow = typeof exams.$inferSelect;

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  question_ids: text("question_ids", { mode: 'json' }).notNull(),
  created_at: integer("created_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export type RoomRow = typeof rooms.$inferSelect;

export const mockboardQuestions = sqliteTable("mockboard_questions", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  options: text("options", { mode: 'json' }).notNull(),
  correct_answer: integer("correct_answer").notNull(),
  subject: text("subject").notNull(),
  set: integer("set"),
  imported_at: integer("imported_at", { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export type MockboardQuestionRow = typeof mockboardQuestions.$inferSelect;
