import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { questionStorage, type Question } from "./questionStorage";
import { examStorage, type Exam } from "./examStorage";
import { roomStorage, type Room } from "./roomStorage";
import express from "express";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // prefix all API routes with /api
  const router = express.Router();

  // AUTH routes
  router.post("/auth/login", async (req, res, next) => {
    try {
      const { username, password, role } = req.body;

      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      // Simple authentication logic
      if (role === "admin") {
        // For admin, check if password is "123" (as hinted in the UI)
        if (password === "123") {
          const user = { id: "admin", username, role: "admin" };
          res.json({ user });
        } else {
          res.status(401).json({ message: "Invalid admin password" });
        }
      } else {
        // For students/librarians, just accept any username
        const user = { id: crypto.randomUUID(), username, role: role || "student" };
        res.json({ user });
      }
    } catch (e) {
      next(e);
    }
  });

  // simple health
  router.get("/health", (_req, res) => res.json({ ok: true }));

  // QUESTIONS CRUD
  router.get("/questions", async (req, res, next) => {
    try {
      const category = req.query.category as string;
      const ids = req.query.ids as string;
      const batchSize = parseInt(req.query.batchSize as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (ids) {
        // Fetch specific questions by IDs with batching support
        const idArray = ids.split(',').map(id => id.trim());
        const totalQuestions = idArray.length;

        // Apply offset and batch size
        const startIndex = offset;
        const endIndex = Math.min(startIndex + batchSize, totalQuestions);
        const batchIds = idArray.slice(startIndex, endIndex);

        const questions = [];
        for (const id of batchIds) {
          const question = await questionStorage.get(id);
          if (question) questions.push(question);
        }

        res.json({
          questions,
          hasMore: endIndex < totalQuestions,
          total: totalQuestions,
          offset: endIndex
        });
      } else {
        const list = await questionStorage.list(category);
        res.json(list);
      }
    } catch (e) {
      next(e);
    }
  });

  router.post("/questions", async (req, res, next) => {
    try {
      const body = req.body as Partial<Question & { category?: string }>;
      if (!body || typeof body.text !== "string" || !Array.isArray(body.options)) {
        return res.status(400).json({ message: "Invalid payload" });
      }
      const created = await questionStorage.create({
        text: body.text,
        options: body.options,
        correctAnswer: Number(body.correctAnswer) || 0,
        subject: body.subject,
        set: body.set,
        category: body.category || "standard",
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.get("/questions/:id", async (req, res, next) => {
    try {
      const q = await questionStorage.get(req.params.id);
      if (!q) return res.status(404).json({ message: "Not found" });
      res.json(q);
    } catch (e) {
      next(e);
    }
  });

  router.put("/questions/:id", async (req, res, next) => {
    try {
      const patch = req.body as Partial<Question>;
      const updated = await questionStorage.update(req.params.id, patch);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.delete("/questions/:id", async (req, res, next) => {
    try {
      const ok = await questionStorage.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  // Bulk questions endpoint for large question sets
  router.post("/questions/bulk", async (req, res, next) => {
    try {
      const { ids, batchSize = 100, offset = 0 } = req.body;

      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "ids must be an array" });
      }

      const totalQuestions = ids.length;
      const startIndex = offset;
      const endIndex = Math.min(startIndex + batchSize, totalQuestions);
      const batchIds = ids.slice(startIndex, endIndex);

      // Use bulk database query for better performance
      const questions = await questionStorage.getBulk(batchIds);

      res.json({
        questions,
        hasMore: endIndex < totalQuestions,
        total: totalQuestions,
        offset: endIndex
      });
    } catch (e) {
      next(e);
    }
  });

  // Bulk questions endpoint for rooms (POST to avoid URL length limits)
  router.post("/questions/room", async (req, res, next) => {
    try {
      const { roomId, batchSize = 100, offset = 0 } = req.body;

      if (!roomId) {
        return res.status(400).json({ error: "roomId required" });
      }

      // Get the room to access its question IDs
      const room = await roomStorage.get(roomId);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const totalQuestions = room.questionIds.length;
      const startIndex = offset;
      const endIndex = Math.min(startIndex + batchSize, totalQuestions);
      const batchIds = room.questionIds.slice(startIndex, endIndex);

      // Use bulk database query for better performance
      const questions = await questionStorage.getBulk(batchIds);

      res.json({
        questions,
        hasMore: endIndex < totalQuestions,
        total: totalQuestions,
        offset: endIndex
      });
    } catch (e) {
      next(e);
    }
  });

  // MOCKBOARD QUESTIONS CRUD
  router.get("/mockboard-questions", async (req, res, next) => {
    try {
      const { db } = await import("./db");
      const { mockboardQuestions } = await import("../shared/schema");
      const { desc } = await import("drizzle-orm");

      const questions = await db.select().from(mockboardQuestions).orderBy(desc(mockboardQuestions.id));
      res.json(questions);
    } catch (e) {
      next(e);
    }
  });

  router.post("/mockboard-questions", async (req, res, next) => {
    try {
      const { db } = await import("./db");
      const { mockboardQuestions } = await import("../shared/schema");

      const body = req.body;
      if (!body || typeof body.text !== "string" || !Array.isArray(body.options)) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      const [created] = await db.insert(mockboardQuestions).values({
        id: crypto.randomUUID(),
        text: body.text,
        options: body.options,
        correctAnswer: Number(body.correctAnswer) || 0,
        subject: body.subject,
        set: body.set,
      }).returning();

      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.post("/mockboard-questions/bulk", async (req, res, next) => {
    try {
      const { db } = await import("./db");
      const { mockboardQuestions } = await import("../shared/schema");

      const { questions } = req.body;
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Questions array required" });
      }

      const values = questions.map(q => ({
        id: crypto.randomUUID(),
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer,
        subject: q.subject,
        set: q.set,
      }));

      const inserted = await db.insert(mockboardQuestions).values(values).returning();
      res.status(201).json({ count: inserted.length, questions: inserted });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/mockboard-questions/:id", async (req, res, next) => {
    try {
      const { db } = await import("./db");
      const { mockboardQuestions } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");

      const result = await db.delete(mockboardQuestions).where(eq(mockboardQuestions.id, req.params.id));
      if (result.rowsAffected === 0) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/mockboard-questions", async (req, res, next) => {
    try {
      const { db } = await import("./db");
      const { mockboardQuestions } = await import("../shared/schema");

      const result = await db.delete(mockboardQuestions);
      res.json({ deletedCount: result.rowsAffected || 0 });
    } catch (e) {
      next(e);
    }
  });

  // EXAMS CRUD
  router.get("/exams", async (_req, res, next) => {
    try {
      const list = await examStorage.list();
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  router.post("/exams", async (req, res, next) => {
    try {
      const body = req.body as Partial<Exam>;
      if (!body || typeof body.title !== "string" || !Array.isArray(body.questionIds)) {
        return res.status(400).json({ message: "Invalid payload" });
      }
      const created = await examStorage.create({
        title: body.title,
        questionIds: body.questionIds,
        durationMinutes: Number(body.durationMinutes) || undefined,
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.get("/exams/:id", async (req, res, next) => {
    try {
      const q = await examStorage.get(req.params.id);
      if (!q) return res.status(404).json({ message: "Not found" });
      res.json(q);
    } catch (e) {
      next(e);
    }
  });

  router.put("/exams/:id", async (req, res, next) => {
    try {
      const patch = req.body as Partial<Exam>;
      const updated = await examStorage.update(req.params.id, patch);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.delete("/exams/:id", async (req, res, next) => {
    try {
      const ok = await examStorage.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  // ROOMS CRUD
  router.get("/rooms", async (_req, res, next) => {
    try {
      const list = await roomStorage.list();
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  router.post("/rooms", async (req, res, next) => {
    try {
      const body = req.body as Partial<Room>;
      if (!body || typeof body.name !== "string" || typeof body.password !== "string" || !Array.isArray(body.questionIds)) {
        return res.status(400).json({ message: "Invalid payload" });
      }
      const created = await roomStorage.create({
        name: body.name,
        password: body.password,
        questionIds: body.questionIds,
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.get("/rooms/:id", async (req, res, next) => {
    try {
      const room = await roomStorage.get(req.params.id);
      if (!room) return res.status(404).json({ message: "Not found" });
      res.json(room);
    } catch (e) {
      next(e);
    }
  });

  router.post("/rooms/:id/verify", async (req, res, next) => {
    try {
      const { password } = req.body;
      if (typeof password !== "string") {
        return res.status(400).json({ message: "Password required" });
      }
      const isValid = await roomStorage.verifyPassword(req.params.id, password);
      res.json({ valid: isValid });
    } catch (e) {
      next(e);
    }
  });

  router.put("/rooms/:id", async (req, res, next) => {
    try {
      const body = req.body as Partial<Room>;
      if (!body || (typeof body.name !== "string" && typeof body.password !== "string" && !Array.isArray(body.questionIds))) {
        return res.status(400).json({ message: "Invalid payload" });
      }
      const updated = await roomStorage.update(req.params.id, body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.delete("/rooms/:id", async (req, res, next) => {
    try {
      const ok = await roomStorage.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  app.use("/api", router);

  return httpServer;
}
