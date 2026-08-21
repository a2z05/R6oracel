import type { MapMeta, Room, Connection, SpawnPoint } from "@oracle/domain";

/** Interface for external data providers (r6maps, r6plans, etc.). */
export interface MapDataProvider {
  name: string;

  /** Fetch all available maps. */
  fetchMaps(): Promise<MapMeta[]>;

  /** Fetch rooms for a specific map. */
  fetchRooms(mapId: string): Promise<Room[]>;

  /** Fetch connections between rooms. */
  fetchConnections(mapId: string): Promise<Connection[]>;

  /** Fetch spawn points. */
  fetchSpawnPoints(mapId: string): Promise<SpawnPoint[]>;

  /** Download a map overview image as buffer. */
  fetchMapImage(mapId: string): Promise<Buffer>;

  /** Download a specific room image as buffer. */
  fetchRoomImage(mapId: string, roomId: string): Promise<Buffer>;
}
