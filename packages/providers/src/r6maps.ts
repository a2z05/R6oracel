import type { MapDataProvider, MapMeta, Room, Connection, SpawnPoint } from "@oracle/domain";

const BASE_URL = "https://r6maps.com";

/**
 * Provider adapter for r6maps.com community data.
 * Fetches map callouts, room positions, and tactical data.
 */
export class R6MapsProvider implements MapDataProvider {
  name = "r6maps";

  async fetchMaps(): Promise<MapMeta[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/maps`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as MapMeta[];
    } catch (err) {
      console.error("[provider] r6maps fetchMaps failed:", err);
      return [];
    }
  }

  async fetchRooms(mapId: string): Promise<Room[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/maps/${mapId}/rooms`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as Room[];
    } catch (err) {
      console.error(`[provider] r6maps fetchRooms(${mapId}) failed:`, err);
      return [];
    }
  }

  async fetchConnections(mapId: string): Promise<Connection[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/maps/${mapId}/connections`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as Connection[];
    } catch (err) {
      console.error(`[provider] r6maps fetchConnections(${mapId}) failed:`, err);
      return [];
    }
  }

  async fetchSpawnPoints(mapId: string): Promise<SpawnPoint[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/maps/${mapId}/spawns`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as SpawnPoint[];
    } catch (err) {
      console.error(`[provider] r6maps fetchSpawnPoints(${mapId}) failed:`, err);
      return [];
    }
  }

  async fetchMapImage(mapId: string): Promise<Buffer> {
    const response = await fetch(`${BASE_URL}/maps/${mapId}/full`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  async fetchRoomImage(mapId: string, roomId: string): Promise<Buffer> {
    const response = await fetch(`${BASE_URL}/maps/${mapId}/rooms/${roomId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}
