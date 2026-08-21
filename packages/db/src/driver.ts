import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type OracleDb = ReturnType<typeof createDatabase>;

/**
 * Open (or create) the SQLite database with performance pragmas.
 * WAL mode allows concurrent reads while writing.
 */
export function createDatabase(dbPath: string): OracleDb {
  const raw = new Database(dbPath);

  // Performance pragmas — safe for single-process Electron app
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");
  raw.pragma("busy_timeout = 5000");
  raw.pragma("synchronous = NORMAL");
  raw.pragma("cache_size = -8000"); // 8 MB page cache
  raw.pragma("temp_store = MEMORY");

  return drizzle(raw, { schema });
}

/**
 * Create an in-memory database for tests.
 */
export function createTestDatabase(): OracleDb {
  return createDatabase(":memory:");
}
