/** Map coordinate and room lookup utilities. */

import type { Room, Connection } from "@oracle/domain";

/**
 * Find a room by normalized (x, y) position on the map.
 * Returns the smallest enclosing room, or null.
 */
export function findRoomAtPosition(
  rooms: Room[],
  x: number,
  y: number
): Room | null {
  let best: Room | null = null;
  let bestArea = Infinity;

  for (const room of rooms) {
    if (
      x >= room.x &&
      x <= room.x + room.width &&
      y >= room.y &&
      y <= room.y + room.height
    ) {
      const area = room.width * room.height;
      if (area < bestArea) {
        best = room;
        bestArea = area;
      }
    }
  }

  return best;
}

/**
 * Get all rooms connected to a given room via connections.
 * Returns unique room IDs (not including the source room).
 */
export function getConnectedRoomIds(
  roomId: string,
  connections: Connection[]
): string[] {
  const ids = new Set<string>();

  for (const conn of connections) {
    if (conn.fromRoomId === roomId) {
      ids.add(conn.toRoomId);
    } else if (conn.toRoomId === roomId) {
      ids.add(conn.fromRoomId);
    }
  }

  return Array.from(ids);
}

/**
 * Get the Euclidean distance between two normalized map positions.
 */
export function mapDistance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get rooms on a specific floor of a map, sorted by name.
 */
export function getRoomsOnFloor(rooms: Room[], floor: number): Room[] {
  return rooms
    .filter((r) => r.floor === floor)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get the center point of a room.
 */
export function roomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2,
  };
}

/**
 * Convert normalized (0-1) coordinates to pixel coordinates.
 */
export function normalizedToPixel(
  pos: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: pos.x * canvasWidth,
    y: pos.y * canvasHeight,
  };
}

/**
 * Convert pixel coordinates to normalized (0-1).
 */
export function pixelToNormalized(
  pos: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: canvasWidth > 0 ? pos.x / canvasWidth : 0,
    y: canvasHeight > 0 ? pos.y / canvasHeight : 0,
  };
}
