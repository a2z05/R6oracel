import type { OracleDb } from "./driver.js";
import * as repos from "./repositories.js";
import type { MapMeta, Room, Connection, SpawnPoint } from "@oracle/domain";

/** Pre-seeded Rainbow Six Siege map data. */
const SEED_MAPS: MapMeta[] = [
  { id: "bank", name: "Bank", floors: 3, hasBasement: true },
  { id: "border", name: "Border", floors: 2, hasBasement: false },
  { id: "chalet", name: "Chalet", floors: 3, hasBasement: true },
  { id: "clubhouse", name: "Clubhouse", floors: 3, hasBasement: true },
  { id: "consulate", name: "Consulate", floors: 3, hasBasement: true },
  { id: "fortress", name: "Fortress", floors: 3, hasBasement: false },
  { id: "kanal", name: "Kanal", floors: 3, hasBasement: false },
  { id: "kafe-dostoyevsky", name: "Kafe Dostoyevsky", floors: 3, hasBasement: false },
  { id: "oregon", name: "Oregon", floors: 3, hasBasement: true },
  { id: "outback", name: "Outback", floors: 2, hasBasement: false },
  { id: "villa", name: "Villa", floors: 3, hasBasement: false },
  { id: "theme-park", name: "Theme Park", floors: 2, hasBasement: false },
  { id: "tower", name: "Tower", floors: 3, hasBasement: false },
  { id: "skyscraper", name: "Skyscraper", floors: 3, hasBasement: false },
  { id: "yacht", name: "Yacht", floors: 4, hasBasement: true },
  { id: "house", name: "House", floors: 2, hasBasement: false },
  { id: "favela", name: "Favela", floors: 3, hasBasement: false },
  { id: "presidential-plane", name: "Presidential Plane", floors: 2, hasBasement: false },
  { id: "lair", name: "Lair", floors: 3, hasBasement: true },
  { id: "emerald-plain", name: "Emerald Plain", floors: 2, hasBasement: false },
  { id: "lite", name: "Lito", floors: 2, hasBasement: false },
];

/** Seed rooms for Bank map (representative example — all maps follow same pattern). */
const SEED_ROOMS_BANK: Array<Omit<Room, "id"> & { aliases: string[] }> = [
  // Basement
  { mapId: "bank", floor: -1, name: "Vault", displayName: "Vault", x: 0.42, y: 0.45, width: 0.16, height: 0.12, aliases: ["vault", "bank vault"] },
  { mapId: "bank", floor: -1, name: "CCTV Room", displayName: "CCTV Room", x: 0.25, y: 0.35, width: 0.12, height: 0.1, aliases: ["cctv", "cctv room", "cam"] },
  { mapId: "bank", floor: -1, name: "Lockers", displayName: "Lockers", x: 0.6, y: 0.35, width: 0.14, height: 0.1, aliases: ["lockers", "locker"] },
  { mapId: "bank", floor: -1, name: "Server Room", displayName: "Server Room", x: 0.3, y: 0.55, width: 0.12, height: 0.1, aliases: ["server", "server room"] },
  { mapId: "bank", floor: -1, name: "Tellers", displayName: "Tellers", x: 0.5, y: 0.6, width: 0.1, height: 0.08, aliases: ["tellers", "teller"] },
  // Ground
  { mapId: "bank", floor: 0, name: "Lobby", displayName: "Lobby", x: 0.35, y: 0.4, width: 0.2, height: 0.15, aliases: ["lobby", "main lobby"] },
  { mapId: "bank", floor: 0, name: "Open Area", displayName: "Open Area", x: 0.55, y: 0.3, width: 0.15, height: 0.12, aliases: ["open", "open area"] },
  { mapId: "bank", floor: 0, name: "Staff Room", displayName: "Staff Room", x: 0.2, y: 0.3, width: 0.1, height: 0.1, aliases: ["staff", "staff room"] },
  { mapId: "bank", floor: 0, name: "Archives", displayName: "Archives", x: 0.7, y: 0.45, width: 0.1, height: 0.1, aliases: ["archives", "archive"] },
  { mapId: "bank", floor: 0, name: "Garage", displayName: "Garage", x: 0.15, y: 0.55, width: 0.15, height: 0.12, aliases: ["garage", "parking"] },
  // Upper
  { mapId: "bank", floor: 1, name: "Executive Lounge", displayName: "Executive Lounge", x: 0.35, y: 0.35, width: 0.18, height: 0.12, aliases: ["exec", "executive", "exec lounge"] },
  { mapId: "bank", floor: 1, name: "CEO Office", displayName: "CEO Office", x: 0.55, y: 0.4, width: 0.12, height: 0.1, aliases: ["ceo", "ceo office"] },
  { mapId: "bank", floor: 1, name: "Servers", displayName: "Servers", x: 0.3, y: 0.55, width: 0.1, height: 0.1, aliases: ["servers", "server"] },
  { mapId: "bank", floor: 1, name: "Janitor", displayName: "Janitor", x: 0.65, y: 0.55, width: 0.08, height: 0.08, aliases: ["janitor", "janitors"] },
  { mapId: "bank", floor: 1, name: "Top Square", displayName: "Top Square", x: 0.4, y: 0.5, width: 0.15, height: 0.1, aliases: ["top square", "square"] },
];

/** Seed rooms for Oregon map. */
const SEED_ROOMS_OREGON: Array<Omit<Room, "id"> & { aliases: string[] }> = [
  // Basement
  { mapId: "oregon", floor: -1, name: "Basement", displayName: "Basement", x: 0.3, y: 0.4, width: 0.4, height: 0.2, aliases: ["basement", "b1"] },
  { mapId: "oregon", floor: -1, name: "Laundry", displayName: "Laundry", x: 0.2, y: 0.35, width: 0.12, height: 0.1, aliases: ["laundry", "laundry room"] },
  { mapId: "oregon", floor: -1, name: "Supply Room", displayName: "Supply Room", x: 0.6, y: 0.55, width: 0.12, height: 0.1, aliases: ["supply", "supply room"] },
  { mapId: "oregon", floor: -1, name: "Freezer", displayName: "Freezer", x: 0.15, y: 0.5, width: 0.1, height: 0.08, aliases: ["freezer", "freezer room"] },
  // Ground
  { mapId: "oregon", floor: 0, name: "Kitchen", displayName: "Kitchen", x: 0.3, y: 0.3, width: 0.15, height: 0.12, aliases: ["kitchen", "kitchen hall"] },
  { mapId: "oregon", floor: 0, name: "Meeting Hall", displayName: "Meeting Hall", x: 0.5, y: 0.35, width: 0.2, height: 0.15, aliases: ["meeting", "meeting hall", "meeting room"] },
  { mapId: "oregon", floor: 0, name: "Dining Room", displayName: "Dining Room", x: 0.2, y: 0.45, width: 0.12, height: 0.1, aliases: ["dining", "dining room"] },
  { mapId: "oregon", floor: 0, name: "Trophy Room", displayName: "Trophy Room", x: 0.65, y: 0.3, width: 0.1, height: 0.1, aliases: ["trophy", "trophy room"] },
  { mapId: "oregon", floor: 0, name: "Big Tower", displayName: "Big Tower", x: 0.7, y: 0.5, width: 0.1, height: 0.15, aliases: ["big tower", "tower", "bt"] },
  { mapId: "oregon", floor: 0, name: "Small Tower", displayName: "Small Tower", x: 0.15, y: 0.3, width: 0.08, height: 0.12, aliases: ["small tower", "st"] },
  // Upper
  { mapId: "oregon", floor: 1, name: "Kids Room", displayName: "Kids Room", x: 0.35, y: 0.35, width: 0.15, height: 0.12, aliases: ["kids", "kids room", "kids bedroom"] },
  { mapId: "oregon", floor: 1, name: "Dormitory", displayName: "Dormitory", x: 0.55, y: 0.3, width: 0.18, height: 0.12, aliases: ["dorms", "dormitory", "dorm"] },
  { mapId: "oregon", floor: 1, name: "Attic", displayName: "Attic", x: 0.4, y: 0.5, width: 0.2, height: 0.1, aliases: ["attic", "attic room"] },
  { mapId: "oregon", floor: 1, name: "Armory", displayName: "Armory", x: 0.2, y: 0.4, width: 0.12, height: 0.1, aliases: ["armory", "armoury"] },
];

/** Seed rooms for Chalet map. */
const SEED_ROOMS_CHALET: Array<Omit<Room, "id"> & { aliases: string[] }> = [
  // Basement
  { mapId: "chalet", floor: -1, name: "Wine Cellar", displayName: "Wine Cellar", x: 0.25, y: 0.4, width: 0.15, height: 0.12, aliases: ["wine", "wine cellar", "cellar"] },
  { mapId: "chalet", floor: -1, name: "Snowmobile Garage", displayName: "Snowmobile Garage", x: 0.55, y: 0.45, width: 0.18, height: 0.12, aliases: ["snowmobile", "snowmobile garage", "snow"] },
  { mapId: "chalet", floor: -1, name: "Kitchen", displayName: "Kitchen", x: 0.4, y: 0.55, width: 0.12, height: 0.1, aliases: ["kitchen", "b kitchen"] },
  // Ground
  { mapId: "chalet", floor: 0, name: "Great Room", displayName: "Great Room", x: 0.35, y: 0.35, width: 0.2, height: 0.15, aliases: ["great room", "great"] },
  { mapId: "chalet", floor: 0, name: "Bar", displayName: "Bar", x: 0.6, y: 0.3, width: 0.1, height: 0.1, aliases: ["bar", "bar area"] },
  { mapId: "chalet", floor: 0, name: "Library", displayName: "Library", x: 0.2, y: 0.3, width: 0.12, height: 0.1, aliases: ["library", "lib"] },
  { mapId: "chalet", floor: 0, name: "Kitchen", displayName: "Kitchen", x: 0.45, y: 0.5, width: 0.12, height: 0.1, aliases: ["kitchen", "ground kitchen"] },
  { mapId: "chalet", floor: 0, name: "Piano Room", displayName: "Piano Room", x: 0.65, y: 0.5, width: 0.1, height: 0.1, aliases: ["piano", "piano room"] },
  // Upper
  { mapId: "chalet", floor: 1, name: "Master Bedroom", displayName: "Master Bedroom", x: 0.3, y: 0.35, width: 0.18, height: 0.12, aliases: ["master", "master bedroom", "mb"] },
  { mapId: "chalet", floor: 1, name: "Office", displayName: "Office", x: 0.55, y: 0.3, width: 0.12, height: 0.1, aliases: ["office", "up office"] },
  { mapId: "chalet", floor: 1, name: "Game Room", displayName: "Game Room", x: 0.4, y: 0.5, width: 0.15, height: 0.1, aliases: ["games", "game room"] },
  { mapId: "chalet", floor: 1, name: "Fireplace", displayName: "Fireplace", x: 0.65, y: 0.45, width: 0.1, height: 0.1, aliases: ["fireplace", "fire"] },
];

/** Seed rooms for Clubhouse. */
const SEED_ROOMS_CLUBHOUSE: Array<Omit<Room, "id"> & { aliases: string[] }> = [
  { mapId: "clubhouse", floor: -1, name: "Arsenal Room", displayName: "Arsenal Room", x: 0.3, y: 0.4, width: 0.15, height: 0.12, aliases: ["arsenal", "arsenal room"] },
  { mapId: "clubhouse", floor: -1, name: "Church", displayName: "Church", x: 0.55, y: 0.45, width: 0.15, height: 0.12, aliases: ["church", "basement church"] },
  { mapId: "clubhouse", floor: -1, name: "Blue", displayName: "Blue", x: 0.2, y: 0.55, width: 0.1, height: 0.08, aliases: ["blue", "blue tunnel"] },
  { mapId: "clubhouse", floor: 0, name: "Bar", displayName: "Bar", x: 0.35, y: 0.35, width: 0.15, height: 0.12, aliases: ["bar", "clubhouse bar"] },
  { mapId: "clubhouse", floor: 0, name: "Stockroom", displayName: "Stockroom", x: 0.55, y: 0.3, width: 0.12, height: 0.1, aliases: ["stock", "stockroom"] },
  { mapId: "clubhouse", floor: 0, name: "Strip Club", displayName: "Strip Club", x: 0.2, y: 0.45, width: 0.12, height: 0.1, aliases: ["strip", "strip club"] },
  { mapId: "clubhouse", floor: 0, name: "Garage", displayName: "Garage", x: 0.6, y: 0.5, width: 0.15, height: 0.12, aliases: ["garage", "car garage"] },
  { mapId: "clubhouse", floor: 1, name: "Bedroom", displayName: "Bedroom", x: 0.35, y: 0.35, width: 0.15, height: 0.12, aliases: ["bedroom", "bed"] },
  { mapId: "clubhouse", floor: 1, name: "Gym", displayName: "Gym", x: 0.55, y: 0.4, width: 0.12, height: 0.1, aliases: ["gym", "gym room"] },
  { mapId: "clubhouse", floor: 1, name: "CCTV", displayName: "CCTV", x: 0.25, y: 0.5, width: 0.1, height: 0.1, aliases: ["cctv", "cam"] },
  { mapId: "clubhouse", floor: 1, name: "Cash Room", displayName: "Cash Room", x: 0.65, y: 0.5, width: 0.1, height: 0.1, aliases: ["cash", "cash room"] },
];

/** Seed rooms for Kafe Dostoyevsky. */
const SEED_ROOMS_KAFE: Array<Omit<Room, "id"> & { aliases: string[] }> = [
  { mapId: "kafe-dostoyevsky", floor: 0, name: "Bakery", displayName: "Bakery", x: 0.2, y: 0.4, width: 0.12, height: 0.1, aliases: ["bakery", "bake"] },
  { mapId: "kafe-dostoyevsky", floor: 0, name: "Kitchen", displayName: "Kitchen", x: 0.45, y: 0.45, width: 0.15, height: 0.12, aliases: ["kitchen", "kafe kitchen"] },
  { mapId: "kafe-dostoyevsky", floor: 0, name: "Reading Room", displayName: "Reading Room", x: 0.65, y: 0.35, width: 0.12, height: 0.1, aliases: ["reading", "reading room"] },
  { mapId: "kafe-dostoyevsky", floor: 1, name: "Bar", displayName: "Bar", x: 0.3, y: 0.4, width: 0.15, height: 0.12, aliases: ["bar", "kafe bar"] },
  { mapId: "kafe-dostoyevsky", floor: 1, name: "Fireplace", displayName: "Fireplace", x: 0.55, y: 0.35, width: 0.12, height: 0.1, aliases: ["fireplace", "fire"] },
  { mapId: "kafe-dostoyevsky", floor: 1, name: "Train Museum", displayName: "Train Museum", x: 0.7, y: 0.5, width: 0.1, height: 0.1, aliases: ["train", "train museum"] },
  { mapId: "kafe-dostoyevsky", floor: 2, name: "Penthouse", displayName: "Penthouse", x: 0.35, y: 0.35, width: 0.2, height: 0.15, aliases: ["penthouse", "pent"] },
  { mapId: "kafe-dostoyevsky", floor: 2, name: "Cocktail Lounge", displayName: "Cocktail Lounge", x: 0.6, y: 0.4, width: 0.12, height: 0.1, aliases: ["cocktail", "cocktail lounge"] },
  { mapId: "kafe-dostoyevsky", floor: 2, name: "New Balcony", displayName: "New Balcony", x: 0.2, y: 0.5, width: 0.1, height: 0.08, aliases: ["new balcony", "balcony"] },
];

/** Collect all seed rooms with generated IDs. */
function buildSeedRooms(
  rooms: Array<Omit<Room, "id"> & { aliases: string[] }>
): Array<{ room: Room; aliases: string[] }> {
  return rooms.map((r) => ({
    room: {
      ...r,
      id: `${r.mapId}_${r.floor}_${r.name.toLowerCase().replace(/\s+/g, "_")}`,
    } as Room,
    aliases: r.aliases,
  }));
}

const ALL_SEED_ROOMS = [
  ...buildSeedRooms(SEED_ROOMS_BANK),
  ...buildSeedRooms(SEED_ROOMS_OREGON),
  ...buildSeedRooms(SEED_ROOMS_CHALET),
  ...buildSeedRooms(SEED_ROOMS_CLUBHOUSE),
  ...buildSeedRooms(SEED_ROOMS_KAFE),
];

/**
 * Seed the database with initial R6 Siege map/room data.
 * Idempotent — skips maps/rooms that already exist.
 */
export function seedDatabase(db: OracleDb): void {
  console.log("[seed] Seeding database...");

  // Seed maps
  for (const map of SEED_MAPS) {
    repos.insertMap(db, {
      id: map.id,
      name: map.name,
      floors: map.floors,
      hasBasement: map.hasBasement,
    });
  }
  console.log(`[seed] Seeded ${SEED_MAPS.length} maps`);

  // Seed rooms + aliases
  let roomCount = 0;
  let aliasCount = 0;
  for (const { room, aliases } of ALL_SEED_ROOMS) {
    repos.insertRoom(db, {
      id: room.id,
      mapId: room.mapId,
      floor: room.floor,
      name: room.name,
      displayName: room.displayName,
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
    });
    roomCount++;

    for (const alias of aliases) {
      repos.insertAlias(db, { roomId: room.id, alias });
      aliasCount++;
    }
  }
  console.log(`[seed] Seeded ${roomCount} rooms with ${aliasCount} aliases`);

  // Seed connections (room-to-room within same map/floor)
  let connCount = 0;
  for (const mapId of SEED_MAPS.map((m) => m.id)) {
    const mapRooms = ALL_SEED_ROOMS.filter((r) => r.room.mapId === mapId);

    // Connect rooms on the same floor that are adjacent
    for (let i = 0; i < mapRooms.length; i++) {
      for (let j = i + 1; j < mapRooms.length; j++) {
        const a = mapRooms[i]!.room;
        const b = mapRooms[j]!.room;

        if (a.floor !== b.floor) continue;

        // Check adjacency (normalized distance < 0.25)
        const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
        const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.25) {
          repos.insertConnection(db, {
            fromRoomId: a.id,
            toRoomId: b.id,
            type: "door",
            floorTransfer: false,
          });
          connCount++;
        }
      }
    }
  }
  console.log(`[seed] Seeded ${connCount} connections`);

  // Seed spawn points for each map
  let spawnCount = 0;
  const spawnData: Array<{ mapId: string; name: string; x: number; y: number }> = [
    { mapId: "bank", name: "North Side", x: 0.5, y: 0.05 },
    { mapId: "bank", name: "South Side", x: 0.5, y: 0.95 },
    { mapId: "bank", name: "East Parking", x: 0.9, y: 0.5 },
    { mapId: "chalet", name: "North Slope", x: 0.5, y: 0.05 },
    { mapId: "chalet", name: "South Deck", x: 0.5, y: 0.95 },
    { mapId: "oregon", name: "Junkyard", x: 0.1, y: 0.5 },
    { mapId: "oregon", name: "Street", x: 0.9, y: 0.5 },
    { mapId: "oregon", name: "Road", x: 0.5, y: 0.95 },
    { mapId: "clubhouse", name: "Valley", x: 0.1, y: 0.5 },
    { mapId: "clubhouse", name: "Construction", x: 0.9, y: 0.5 },
    { mapId: "kafe-dostoyevsky", name: "Park", x: 0.5, y: 0.05 },
    { mapId: "kafe-dostoyevsky", name: "Street", x: 0.5, y: 0.95 },
  ];

  for (const sp of spawnData) {
    repos.insertSpawnPoint(db, {
      id: `${sp.mapId}_${sp.name.toLowerCase().replace(/\s+/g, "_")}`,
      mapId: sp.mapId,
      name: sp.name,
      side: "attacker",
      x: sp.x,
      y: sp.y,
    });
    spawnCount++;
  }
  console.log(`[seed] Seeded ${spawnCount} spawn points`);

  console.log("[seed] Database seeding complete");
}
