import { eq, and, desc, sql } from "drizzle-orm";
import type { OracleDb } from "./driver.js";
import * as schema from "./schema.js";

/** Repository layer — all database access goes through here. */

// ─── Maps ─────────────────────────────────────────────────────────────

export function getAllMaps(db: OracleDb) {
  return db.select().from(schema.maps).all();
}

export function getMapById(db: OracleDb, id: string) {
  return db.select().from(schema.maps).where(eq(schema.maps.id, id)).get();
}

export function insertMap(db: OracleDb, data: schema.MapInsert) {
  return db.insert(schema.maps).values(data).onConflictDoNothing().run();
}

// ─── Rooms ────────────────────────────────────────────────────────────

export function getRoomsByMap(db: OracleDb, mapId: string) {
  return db.select().from(schema.rooms).where(eq(schema.rooms.mapId, mapId)).all();
}

export function getRoomsByMapFloor(db: OracleDb, mapId: string, floor: number) {
  return db
    .select()
    .from(schema.rooms)
    .where(and(eq(schema.rooms.mapId, mapId), eq(schema.rooms.floor, floor)))
    .all();
}

export function getRoomById(db: OracleDb, id: string) {
  return db.select().from(schema.rooms).where(eq(schema.rooms.id, id)).get();
}

export function insertRoom(db: OracleDb, data: schema.RoomInsert) {
  return db.insert(schema.rooms).values(data).onConflictDoNothing().run();
}

// ─── Aliases ──────────────────────────────────────────────────────────

export function getAliasesByRoom(db: OracleDb, roomId: string) {
  return db.select().from(schema.roomAliases).where(eq(schema.roomAliases.roomId, roomId)).all();
}

export function getAllAliases(db: OracleDb) {
  return db.select().from(schema.roomAliases).all();
}

export function insertAlias(db: OracleDb, data: schema.RoomAliasInsert) {
  return db.insert(schema.roomAliases).values(data).onConflictDoNothing().run();
}

// ─── Connections ──────────────────────────────────────────────────────

export function getConnectionsByMap(db: OracleDb, mapId: string) {
  return db
    .select({
      id: schema.connections.id,
      fromRoomId: schema.connections.fromRoomId,
      toRoomId: schema.connections.toRoomId,
      type: schema.connections.type,
      floorTransfer: schema.connections.floorTransfer,
    })
    .from(schema.connections)
    .innerJoin(schema.rooms, eq(schema.connections.fromRoomId, schema.rooms.id))
    .where(eq(schema.rooms.mapId, mapId))
    .all();
}

export function insertConnection(db: OracleDb, data: schema.ConnectionInsert) {
  return db.insert(schema.connections).values(data).onConflictDoNothing().run();
}

// ─── Spawn Points ─────────────────────────────────────────────────────

export function getSpawnPointsByMap(db: OracleDb, mapId: string) {
  return db.select().from(schema.spawnPoints).where(eq(schema.spawnPoints.mapId, mapId)).all();
}

export function insertSpawnPoint(db: OracleDb, data: schema.SpawnPointInsert) {
  return db.insert(schema.spawnPoints).values(data).onConflictDoNothing().run();
}

// ─── Strat Cards ──────────────────────────────────────────────────────

export function getStratCardsByMap(db: OracleDb, mapId: string) {
  return db
    .select()
    .from(schema.stratCards)
    .where(eq(schema.stratCards.mapId, mapId))
    .orderBy(schema.stratCards.priority)
    .all();
}

export function getStratCardsByPhase(db: OracleDb, mapId: string, phase: string) {
  return db
    .select()
    .from(schema.stratCards)
    .where(and(eq(schema.stratCards.mapId, mapId), eq(schema.stratCards.phase, phase)))
    .orderBy(schema.stratCards.priority)
    .all();
}

export function insertStratCard(db: OracleDb, data: schema.StratCardInsert) {
  return db.insert(schema.stratCards).values(data).onConflictDoNothing().run();
}

// ─── Settings ─────────────────────────────────────────────────────────

export function getSetting(db: OracleDb, key: string) {
  const row = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  if (!row) return null;
  try {
    return JSON.parse(row.value) as unknown;
  } catch {
    return row.value;
  }
}

export function setSetting(db: OracleDb, key: string, value: unknown, category: string) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return db
    .insert(schema.settings)
    .values({ key, value: serialized, category, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: serialized, updatedAt: new Date() },
    })
    .run();
}

export function getAllSettings(db: OracleDb) {
  return db.select().from(schema.settings).all();
}

// ─── Room History ─────────────────────────────────────────────────────

export function addRoomHistory(db: OracleDb, roomId: string, confidence: number) {
  return db
    .insert(schema.roomHistory)
    .values({ roomId, detectedAt: new Date(), confidence })
    .run();
}

export function getRecentHistory(db: OracleDb, limit: number = 20) {
  return db
    .select()
    .from(schema.roomHistory)
    .orderBy(desc(schema.roomHistory.detectedAt))
    .limit(limit)
    .all();
}

// ─── OCR Cache ────────────────────────────────────────────────────────

export function getOcrCacheEntry(db: OracleDb, normalized: string) {
  return db.select().from(schema.ocrCache).where(eq(schema.ocrCache.normalized, normalized)).get();
}

export function upsertOcrCache(
  db: OracleDb,
  rawText: string,
  normalized: string,
  roomId: string | null
) {
  const existing = getOcrCacheEntry(db, normalized);
  if (existing) {
    return db
      .update(schema.ocrCache)
      .set({
        hitCount: existing.hitCount + 1,
        lastSeen: new Date(),
        roomId: roomId ?? existing.roomId,
      })
      .where(eq(schema.ocrCache.normalized, normalized))
      .run();
  }
  return db
    .insert(schema.ocrCache)
    .values({ rawText, normalized, roomId, hitCount: 1, lastSeen: new Date() })
    .run();
}

// ─── Favorites ────────────────────────────────────────────────────────

export function getFavoriteMaps(db: OracleDb) {
  return db.select().from(schema.favorites).all();
}

export function addFavorite(db: OracleDb, mapId: string) {
  return db.insert(schema.favorites).values({ mapId }).onConflictDoNothing().run();
}

export function removeFavorite(db: OracleDb, mapId: string) {
  return db.delete(schema.favorites).where(eq(schema.favorites.mapId, mapId)).run();
}
