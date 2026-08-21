/** Tactical strategy card domain types. */

export type StratPhase =
  | "defense_prep"
  | "round1_defense"
  | "attack"
  | "post_plant";

export type StratModule =
  | "spawn_peek"
  | "site_setup"
  | "plant_tips"
  | "rotate_routes"
  | "room_images"
  | "neighbor_rooms"
  | "operator_tips";

export interface StratCard {
  id: string;
  mapId: string | null; // null = universal
  siteRoomIds: string[];
  phase: StratPhase;
  title: string;
  body: string; // markdown content
  priority: number;
  module: StratModule;
  isActive: boolean;
}

export const PHASE_LABELS: Record<StratPhase, string> = {
  defense_prep: "Defense Prep",
  round1_defense: "Round 1 Defense",
  attack: "Attack",
  post_plant: "Post Plant",
};

export const MODULE_LABELS: Record<StratModule, string> = {
  spawn_peek: "Spawn Peek",
  site_setup: "Site Setup",
  plant_tips: "Plant Tips",
  rotate_routes: "Rotate Routes",
  room_images: "Room Images",
  neighbor_rooms: "Neighbor Rooms",
  operator_tips: "Operator Tips",
};
