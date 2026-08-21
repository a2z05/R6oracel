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
  "dDerail",
  "emerald-plain",
  "fortress",
  "favela",
  "house",
  "kanal",
  "kafe-dostoyevsky",
  "lake-mid",
  "lair",
  "oregon",
  "outback",
  "presidential-plane",
  "radient",
  "skyscraper",
  "theme-park",
  "tower",
  "villa",
  "yacht",
] as const;

export type MapId = (typeof R6_MAPS)[number];
