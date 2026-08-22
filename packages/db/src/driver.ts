import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export interface OracleDb {
  /** Drizzle ORM instance for type-safe queries */
  orm: BetterSQLite3Database<typeof schema>;
  /** Raw better-sqlite3 instance for raw SQL */
  raw: Database;
  /** Run a raw SQL query returning all rows */
  all(sql: string, params?: unknown[]): unknown[];
  /** Run a raw SQL query returning a single row */
  get(sql: string, params?: unknown[]): unknown;
  /** Run a raw SQL statement (INSERT/UPDATE/DELETE) */
  run(sql: string, params?: unknown[]): void;
}

/**
 * Open (or create) the SQLite database with performance pragmas.
 * Returns both a Drizzle ORM instance and raw SQL helpers.
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

  const orm = drizzle(raw, { schema });

  return {
    orm,
    raw,
    all(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).all(...params);
    },
    get(sql: string, params: unknown[] = []) {
      return raw.prepare(sql).get(...params);
    },
    run(sql: string, params: unknown[] = []) {
      raw.prepare(sql).run(...params);
    },
  };
}

/**
 * Create an in-memory database for tests.
 */
export function createTestDatabase(): OracleDb {
  return createDatabase(":memory:");
}
