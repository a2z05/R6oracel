/** Core map and room domain types for Rainbow Six Siege. */

export interface MapMeta {
  id: string;
  name: string;
  floors: number;
  hasBasement: boolean;
  thumbnailUrl?: string;
  assetPath?: string;
}

export interface Room {
  id: string;
  mapId: string;
  floor: number; // -1=basement, 0=ground, 1=upper, 2=top
  name: string;
  displayName: string;
  /** Normalized 0-1 position on map image */
  x: number;
  y: number;
  width: number;
  height: number;
  imagePath?: string;
  imageUrl?: string;
}

export interface RoomAlias {
  id: number;
  roomId: string;
  alias: string;
}

export interface Connection {
  id: number;
  fromRoomId: string;
  toRoomId: string;
  type: ConnectionType;
  floorTransfer: boolean;
}

export type ConnectionType = "door" | "rotation" | "hatch" | "window" | "stairs";

export interface SpawnPoint {
  id: string;
  mapId: string;
  name: string;
  side: "attacker" | "defender";
  x: number;
  y: number;
}

export interface FloorInfo {
  level: number;
  label: string; // "B1", "G", "1F", "2F"
  shortLabel: string;
}

export const FLOOR_LABELS: Record<number, FloorInfo> = {
  [-1]: { level: -1, label: "Basement", shortLabel: "B1" },
  [0]: { level: 0, label: "Ground Floor", shortLabel: "G" },
  [1]: { level: 1, label: "1st Floor", shortLabel: "1F" },
  [2]: { level: 2, label: "2nd Floor", shortLabel: "2F" },
  [3]: { level: 3, label: "3rd Floor", shortLabel: "3F" },
};

/** All ranked/map pool IDs */
export const R6_MAPS = [
  "bank",
  "border",
  "chalet",
  "clubhouse",
  "consulate",
  "emerald-plain",
  "fortress",
  "favela",
  "house",
  "kanal",
  "kafe-dostoyevsky",
  "lair",
  "oregon",
  "outback",
  "presidential-plane",
  "skyscraper",
  "theme-park",
  "tower",
  "villa",
  "yacht",
] as const;

export type MapId = (typeof R6_MAPS)[number];

/** Map metadata with floor info and bomb sites. */
export const MAP_DATA: Record<string, { name: string; floors: number; hasBasement: boolean; bombSites: Array<[string, string]>; ranked: boolean; region: string }> = {
  bank:                { name: "Bank",                floors: 3, hasBasement: true,  bombSites: [["Vault", "CCTV Room"], ["Executive Lounge", "CEO Office"], ["Lockers", "Server Room"]], ranked: true, region: "USA" },
  border:              { name: "Border",              floors: 3, hasBasement: false, bombSites: [["Armory Lockers", "Archives"], ["Workshop", "Ventilation Room"], ["Tellers", "Visa Office"], ["Customs Inspection", "Detention"]], ranked: true, region: "Middle East" },
  chalet:              { name: "Chalet",              floors: 3, hasBasement: true,  bombSites: [["Wine Cellar", "Snowmobile Garage"], ["Master Bedroom", "Office"]], ranked: true, region: "France" },
  clubhouse:           { name: "Clubhouse",           floors: 3, hasBasement: true,  bombSites: [["Arsenal Room", "Church"], ["Bedroom", "Gym"], ["Cash Room", "CCTV"]], ranked: true, region: "Germany" },
  coastline:           { name: "Coastline",           floors: 2, hasBasement: false, bombSites: [["Penthouse", "Theater"], ["Kitchen", "Service Entrance"], ["CCTV Room", "Cash Room"], ["Hookah Lounge", "Billiards Room"]], ranked: true, region: "France" },
  consulate:           { name: "Consulate",           floors: 3, hasBasement: true,  bombSites: [["Garage", "Cafeteria"], ["CEO Office", "Consultation"], ["Archives", "Press Room"]], ranked: true, region: "France" },
  "emerald-plain":     { name: "Emerald Plains",      floors: 2, hasBasement: false, bombSites: [["CCTV", "Armory"], ["Master Bedroom", "Office"]], ranked: true, region: "Ireland" },
  fortress:            { name: "Fortress",            floors: 3, hasBasement: false, bombSites: [["Bar", "Gaming Room"], ["Bedroom", "Bathroom"]], ranked: false, region: "Morocco" },
  favela:              { name: "Favela",              floors: 3, hasBasement: false, bombSites: [["Packaging Room", "Marley Apartment"], ["Meth Lab", "Aunts Apartment"]], ranked: false, region: "Brazil" },
  "hereford-base":     { name: "Hereford Base",       floors: 4, hasBasement: true,  bombSites: [["Armory Lockers", "Church"], ["Garage", "Forge"], ["Kids Bedroom", "Master Bedroom"]], ranked: false, region: "UK" },
  house:               { name: "House",               floors: 2, hasBasement: false, bombSites: [["Kitchen", "Dining Room"], ["Kids Room", "Master Bedroom"]], ranked: false, region: "USA" },
  kanal:               { name: "Kanal",               floors: 3, hasBasement: true,  bombSites: [["Server Room", "Radio Room"], ["Coast Guard", "Reading Room"], ["Lockers", "CCTV"]], ranked: false, region: "Germany" },
  "kafe-dostoyevsky":  { name: "Kafe Dostoyevsky",    floors: 3, hasBasement: false, bombSites: [["Kitchen", "Cocktail Lounge"], ["Penthouse", "Reading Room"]], ranked: true, region: "Russia" },
  lair:                { name: "Lair",                floors: 3, hasBasement: true,  bombSites: [["Bunk", "Day Care"], ["Lab", "Radar"], ["Museum", "Dining Room"], ["Theater", "Vault"]], ranked: true, region: "Central Europe" },
  "nighthaven-labs":   { name: "Nighthaven Labs",     floors: 3, hasBasement: false, bombSites: [["Armory", "Archives"], ["Command Center", "Holding Room"], ["Server Room", "Garage"], ["Staff Room", "Loading Dock"]], ranked: true, region: "Singapore" },
  oregon:              { name: "Oregon",               floors: 3, hasBasement: true,  bombSites: [["Laundry", "Supply Room"], ["Kids Room", "Dormitory"]], ranked: true, region: "USA" },
  outback:             { name: "Outback",              floors: 3, hasBasement: true,  bombSites: [["Compressor", "Kitchen"], ["Party Room", "Office"]], ranked: false, region: "Australia" },
  "presidential-plane":{ name: "Presidential Plane",   floors: 2, hasBasement: false, bombSites: [["Executive Bedroom", "Meeting Room"], ["Luggage Hold", "Cargo Hold"]], ranked: false, region: "USA" },
  skyscraper:          { name: "Skyscraper",           floors: 3, hasBasement: false, bombSites: [["Tea Room", "Karaoke"], ["Geisha", "Restaurants"]], ranked: true, region: "Japan" },
  stadium:             { name: "Stadium",              floors: 2, hasBasement: false, bombSites: [["Armory", "Bedroom"], ["Kitchen", "Dining Area"]], ranked: false, region: "International" },
  "theme-park":        { name: "Theme Park",           floors: 2, hasBasement: false, bombSites: [["Initiation Room", "Cocktail Lounge"], ["Drug Lab", "Storage Room"]], ranked: true, region: "Hong Kong" },
  tower:               { name: "Tower",                floors: 3, hasBasement: false, bombSites: [["Tea Room", "Workshop"], ["CEO Office", "Executive Lounge"]], ranked: false, region: "South Korea" },
  villa:               { name: "Villa",                floors: 3, hasBasement: false, bombSites: [["Aviator", "Games Room"], ["Statuary", "Trophy Room"], ["Master Bedroom", "Closet"], ["Kitchen", "Dining Room"]], ranked: true, region: "Italy" },
  yacht:               { name: "Yacht",                floors: 4, hasBasement: true,  bombSites: [["Engine", "Servers"], ["Cockpit", "Bedroom"]], ranked: false, region: "Norway" },
};
