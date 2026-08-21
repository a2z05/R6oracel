import { createTestDatabase } from "./driver.js";
import type { OracleDb } from "./driver.js";

/**
 * Create a fresh in-memory test database.
 * Each call returns a new isolated database.
 */
export function createTestDb(): OracleDb {
  return createTestDatabase();
}
