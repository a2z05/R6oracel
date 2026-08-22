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

/** Map metadata with floor info */
export const MAP_DATA: Record<string, { name: string; floors: number; hasBasement: boolean; bombSites: Array<[string, string]> }> = {
  bank:          { name: "Bank",           floors: 3, hasBasement: true,  bombSites: [["Vault", "CCTV Room"], ["Executive Lounge", "CEO Office"], ["Lockers", "Server Room"]] },
  border:        { name: "Border",         floors: 2, hasBasement: false, bombSites: [["Armory", "Archives"], ["Workshop", "Ventilation Room"]] },
  chalet:        { name: "Chalet",         floors: 3, hasBasement: true,  bombSites: [["Wine Cellar", "Snowmobile Garage"], ["Master Bedroom", "Office"]] },
  clubhouse:     { name: "Clubhouse",      floors: 3, hasBasement: true,  bombSites: [["Arsenal Room", "Church"], ["Bedroom", "Gym"], ["Cash Room", "CCTV"]] },
  consulate:     { name: "Consulate",      floors: 3, hasBasement: true,  bombSites: [["Garage", "Cafeteria"], ["CEO Office", "Consultation"]] },
  "emerald-plain":{ name: "Emerald Plain", floors: 2, hasBasement: false, bombSites: [["Pillars", "Tellers"], ["Offices", "Archives"]] },
  fortress:      { name: "Fortress",       floors: 3, hasBasement: false, bombSites: [["Bar", "Gaming Room"], ["Bedroom", "Bathroom"]] },
  favela:        { name: "Favela",         floors: 3, hasBasement: false, bombSites: [["Packaging", "Marley Apartment"], ["Meth Lab", "Aunt's Apartment"]] },
  house:         { name: "House",          floors: 2, hasBasement: false, bombSites: [["Kitchen", "Dining Room"], ["Kids Room", "Master Bedroom"]] },
  kanal:         { name: "Kanal",          floors: 3, hasBasement: false, bombSites: [["Server Room", "Radio"], ["Coast Guard", "Reading Room"]] },
  "kafe-dostoyevsky":{ name: "Kafe Dostoyevsky", floors: 3, hasBasement: false, bombSites: [["Kitchen", "Cocktail Lounge"], ["Penthouse", "Reading Room"]] },
  lair:          { name: "Lair",           floors: 3, hasBasement: true,  bombSites: [["Bunk", "Day Care"], ["Lab", "Radar"]] },
  oregon:        { name: "Oregon",         floors: 3, hasBasement: true,  bombSites: [["Laundry", "Supply Room"], ["Kids Room", "Dormitory"]] },
  outback:       { name: "Outback",        floors: 2, hasBasement: false, bombSites: [["Compressor", "Kitchen"], ["Party Room", "Office"]] },
  "presidential-plane":{ name: "Presidential Plane", floors: 2, hasBasement: false, bombSites: [["Executive Bedroom", "Meeting Room"], ["Luggage Hold", "Cargo Hold"]] },
  skyscraper:    { name: "Skyscraper",     floors: 3, hasBasement: false, bombSites: [["Tea Room", "Karaoke"], ["Geisha", "Restaurants"]] },
  "theme-park":  { name: "Theme Park",     floors: 2, hasBasement: false, bombSites: [["Bunk", "Day Care"], ["Drug Lab", "Initiation Room"]] },
  tower:         { name: "Tower",          floors: 3, hasBasement: false, bombSites: [["Tea Room", "Workshop"], ["CEO Office", "Executive Lounge"]] },
  villa:         { name: "Villa",          floors: 3, hasBasement: false, bombSites: [["Aviation", "Trophy"], ["Master Bedroom", "Statuary"]] },
  yacht:         { name: "Yacht",          floors: 4, hasBasement: true,  bombSites: [["Engine", "Servers"], ["Cockpit", "Bedroom"]] },
};
