import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

let sqlite: Database.Database | null = null;
let db: any = null;

sqlite = new Database(process.env.DATABASE_URL || "sqlite.db");
db = drizzle(sqlite);

export { db, sqlite as pool };
