import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { drizzle, type SqlJsDatabase as DrizzleSqlJs } from "drizzle-orm/sql-js";
import * as schema from "./schema.js";
import fs from "node:fs";
import path from "node:path";

export interface OracleDb {
  /** Drizzle ORM instance for type-safe queries */
  orm: DrizzleSqlJs<typeof schema>;
  /** Raw sql.js database instance */
  db: SqlJsDatabase;
  /** File path (null for in-memory) */
  dbPath: string | null;
  /** Run a raw SQL query returning all rows */
  all(sql: string, params?: unknown[]): unknown[];
  /** Run a raw SQL query returning a single row */
  get(sql: string, params?: unknown[]): unknown;
  /** Run a raw SQL statement (INSERT/UPDATE/DELETE) */
  run(sql: string, params?: unknown[]): void;
  /** Save database to disk */
  save(): void;
  /** Close the database */
  close(): void;
}

/**
 * Open (or create) the SQLite database using sql.js (WebAssembly).
 * No native compilation needed — works everywhere.
 */
export async function createDatabase(dbPath: string): Promise<OracleDb> {
  const SQL = await initSqlJs();

  let db: SqlJsDatabase;

  if (dbPath === ":memory:") {
    db = new SQL.Database();
  } else {
    // Load existing database or create new
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(new Uint8Array(buffer));
    } else {
      db = new SQL.Database();
    }
  }

  // Performance pragmas
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA synchronous = NORMAL");
  db.run("PRAGMA cache_size = 8000");
  db.run("PRAGMA temp_store = MEMORY");

  const orm = drizzle(db, { schema });

  const instance: OracleDb = {
    orm,
    db,
    dbPath: dbPath === ":memory:" ? null : dbPath,
    all(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params as any[]);
      const rows: unknown[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    get(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params as any[]);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return row;
    },
    run(sql: string, params: unknown[] = []) {
      db.run(sql, params as any[]);
    },
    save() {
      if (instance.dbPath) {
        const data = db.export();
        fs.writeFileSync(instance.dbPath, Buffer.from(data));
      }
    },
    close() {
      instance.save();
      db.close();
    },
  };

  return instance;
}

/**
 * Create an in-memory database for tests.
 */
export async function createTestDatabase(): Promise<OracleDb> {
  return createDatabase(":memory:");
}
