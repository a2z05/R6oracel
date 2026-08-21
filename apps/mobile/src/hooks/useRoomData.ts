/**
 * Room data hook - manages room/map state from WebSocket messages.
 * Provides derived data like current room info, floor rooms, etc.
 */

import { useMemo } from "react";
import type { ServerState, OcrResult } from "./useWebSocket";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomInfo {
  roomId: string;
  name: string;
  displayName: string;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseRoomDataReturn {
  /** Current map ID */
  currentMap: string | null;
  /** Current room ID from OCR */
  currentRoom: string | null;
  /** Current floor level */
  currentFloor: number;
  /** All rooms for the current map */
  rooms: RoomInfo[];
  /** Rooms filtered to current floor */
  floorRooms: RoomInfo[];
  /** The currently active room object */
  activeRoom: RoomInfo | null;
  /** Last OCR result */
  ocrResult: OcrResult | null;
  /** OCR confidence as percentage (0-100) */
  confidence: number;
  /** Whether OCR is actively detecting */
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRoomData(
  serverState: ServerState | null,
  ocrResult: OcrResult | null
): UseRoomDataReturn {
  const currentMap = serverState?.currentMap ?? null;
  const currentRoom = serverState?.currentRoom ?? null;
  const currentFloor = serverState?.currentFloor ?? 0;

  // Parse rooms from server state
  const rooms: RoomInfo[] = useMemo(() => {
    if (!serverState?.mapRooms) return [];

    return serverState.mapRooms.map((r): RoomInfo => {
      // Handle both typed and untyped room data
      const room = r as Record<string, unknown>;
      return {
        roomId: (room["roomId"] as string) ?? (room["id"] as string) ?? "",
        name: (room["name"] as string) ?? "",
        displayName: (room["displayName"] as string) ?? (room["name"] as string) ?? "",
        floor: (room["floor"] as number) ?? 0,
        x: (room["x"] as number) ?? 0,
        y: (room["y"] as number) ?? 0,
        width: (room["width"] as number) ?? 0,
        height: (room["height"] as number) ?? 0,
      };
    });
  }, [serverState?.mapRooms]);

  // Filter rooms to current floor
  const floorRooms = useMemo(() => {
    return rooms.filter((r) => r.floor === currentFloor);
  }, [rooms, currentFloor]);

  // Find active room
  const activeRoom = useMemo(() => {
    if (!currentRoom) return null;
    return rooms.find((r) => r.roomId === currentRoom) ?? null;
  }, [rooms, currentRoom]);

  // Derived OCR data
  const confidence = ocrResult?.confidence ?? 0;
  const isActive =
    ocrResult !== null && Date.now() - (ocrResult.timestamp ?? 0) < 5000;

  return {
    currentMap,
    currentRoom,
    currentFloor,
    rooms,
    floorRooms,
    activeRoom,
    ocrResult,
    confidence,
    isActive,
  };
}
