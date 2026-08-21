import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDatabase } from "./driver.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run all pending Drizzle migrations against the given database file.
 */
export function runMigrations(dbPath: string): void {
  const db = createDatabase(dbPath);
  const migrationsDir = path.resolve(__dirname, "../drizzle");

  console.log(`[db] Running migrations from ${migrationsDir}`);
  migrate(db, { migrationsFolder: migrationsDir });
  console.log("[db] Migrations complete");
}

// When run directly: `node --loader ts-node/esm src/migrate.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.env["ORACLE_DB_PATH"] ?? path.resolve(__dirname, "../../oracle.db");
  runMigrations(dbPath);
}
