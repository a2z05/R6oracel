import { migrate } from "drizzle-orm/sql-js/migrator";
import { createDatabase } from "./driver.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run all pending Drizzle migrations against the given database file.
 */
export async function runMigrations(dbPath: string): Promise<void> {
  const db = await createDatabase(dbPath);
  const migrationsDir = path.resolve(__dirname, "../drizzle");

  console.log(`[db] Running migrations from ${migrationsDir}`);
  migrate(db.orm, { migrationsFolder: migrationsDir });
  db.save();
  db.close();
  console.log("[db] Migrations complete");
}

// When run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const dbPath = process.env["ORACLE_DB_PATH"] ?? path.resolve(__dirname, "../../oracle.db");
  runMigrations(dbPath).catch(console.error);
}
