import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql, desc } from "drizzle-orm";

/** Current Unix timestamp in milliseconds (Drizzle helper). */
const tsMs = integer("created_at", { mode: "timestamp_ms" })
  .notNull()
  .$defaultFn(() => new Date());

// ─── Maps ─────────────────────────────────────────────────────────────
export const maps = sqliteTable("maps", {
  id: text("id").primaryKey(), // "chalet", "bank", "oregon"
  name: text("name").notNull(), // "Chalet"
  floors: integer("floors").notNull().default(3),
  hasBasement: integer("has_basement", { mode: "boolean" }).notNull().default(false),
  thumbnailUrl: text("thumbnail_url"),
  assetPath: text("asset_path"),
  createdAt: tsMs,
});

// ─── Rooms ────────────────────────────────────────────────────────────
export const rooms = sqliteTable(
  "rooms",
  {
    id: text("id").primaryKey(), // "chalet_b1_wine_cellar"
    mapId: text("map_id")
      .notNull()
      .references(() => maps.id, { onDelete: "cascade" }),
    floor: integer("floor").notNull(), // -1=basement, 0=ground, 1=upper
    name: text("name").notNull(), // "Wine Cellar"
    displayName: text("display_name").notNull(),
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),
    width: real("width").notNull().default(0.1),
    height: real("height").notNull().default(0.1),
    imagePath: text("image_path"),
    imageUrl: text("image_url"),
    createdAt: tsMs,
  },
  (t) => [
    index("rooms_map_floor_idx").on(t.mapId, t.floor),
    index("rooms_name_idx").on(t.name),
  ]
);

// ─── Room Aliases ─────────────────────────────────────────────────────
export const roomAliases = sqliteTable(
  "room_aliases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
  },
  (t) => [
    index("room_aliases_alias_idx").on(t.alias),
    uniqueIndex("room_aliases_room_alias_idx").on(t.roomId, t.alias),
  ]
);

// ─── Connections ──────────────────────────────────────────────────────
export const connections = sqliteTable(
  "connections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fromRoomId: text("from_room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    toRoomId: text("to_room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("door"), // door, rotation, hatch, window, stairs
    floorTransfer: integer("floor_transfer", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    uniqueIndex("connections_pair_idx").on(t.fromRoomId, t.toRoomId),
  ]
);

// ─── Spawn Points ─────────────────────────────────────────────────────
export const spawnPoints = sqliteTable(
  "spawn_points",
  {
    id: text("id").primaryKey(),
    mapId: text("map_id")
      .notNull()
      .references(() => maps.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    side: text("side").notNull().default("attacker"),
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),
  },
  (t) => [index("spawn_map_idx").on(t.mapId)]
);

// ─── Strategy Cards ───────────────────────────────────────────────────
export const stratCards = sqliteTable(
  "strat_cards",
  {
    id: text("id").primaryKey(),
    mapId: text("map_id").references(() => maps.id, { onDelete: "cascade" }),
    siteRoomIds: text("site_room_ids", { mode: "json" }).$type<string[]>().default([]),
    phase: text("phase").notNull(), // defense_prep, round1_defense, attack, post_plant
    title: text("title").notNull(),
    body: text("body").notNull(),
    priority: integer("priority").notNull().default(0),
    module: text("module").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: tsMs,
  },
  (t) => [index("strat_map_phase_idx").on(t.mapId, t.phase)]
);

// ─── Settings ─────────────────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(), // "hotkey.overlay_toggle"
  value: text("value").notNull(), // JSON-encoded
  category: text("category").notNull(), // hotkeys, overlay, ocr, theme, modules
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Room History ─────────────────────────────────────────────────────
export const roomHistory = sqliteTable(
  "room_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    detectedAt: integer("detected_at", { mode: "timestamp_ms" }).notNull(),
    confidence: real("confidence").notNull(),
  },
  (t) => [index("room_history_recent_idx").on(desc(t.detectedAt))]
);

// ─── OCR Cache ────────────────────────────────────────────────────────
export const ocrCache = sqliteTable(
  "ocr_cache",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rawText: text("raw_text").notNull(),
    normalized: text("normalized").notNull(),
    roomId: text("room_id").references(() => rooms.id),
    hitCount: integer("hit_count").notNull().default(1),
    lastSeen: integer("last_seen", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("ocr_cache_normalized_idx").on(t.normalized),
    index("ocr_cache_hits_idx").on(desc(t.hitCount)),
  ]
);

// ─── Favorites ────────────────────────────────────────────────────────
export const favorites = sqliteTable("favorites", {
  mapId: text("map_id")
    .primaryKey()
    .references(() => maps.id, { onDelete: "cascade" }),
  createdAt: tsMs,
});
