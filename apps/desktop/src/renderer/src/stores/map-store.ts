import { create } from "zustand";

interface MapRoom {
  id: string;
  mapId: string;
  floor: number;
  name: string;
  displayName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MapStore {
  selectedMapId: string | null;
  currentFloor: number;
  loading: boolean;
  rooms: MapRoom[];
  connections: Array<{ fromRoomId: string; toRoomId: string; type: string }>;
  highlightedRoomId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  loadMap: (mapId: string) => Promise<void>;
  setFloor: (floor: number) => void;
  highlightRoom: (roomId: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  selectedMapId: null,
  currentFloor: 0,
  loading: false,
  rooms: [],
  connections: [],
  highlightedRoomId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  loadMap: async (mapId) => {
    // Skip if already loaded
    if (get().selectedMapId === mapId && get().rooms.length > 0) return;
    set({ selectedMapId: mapId, loading: true, rooms: [], connections: [], highlightedRoomId: null, currentFloor: 0, zoom: 1, pan: { x: 0, y: 0 } });
    try {
      const rooms = (await window.oracle?.invoke("map:rooms", { mapId })) as unknown[];
      const conns = (await window.oracle?.invoke("map:connections", { mapId }).catch(() => [])) as unknown[];
      // Keep the OCR matcher's alias table in sync with the selected map
      void window.oracle?.invoke("map:aliases-refresh", { mapId }).catch(() => {});
      set({
        loading: false,
        rooms: (rooms ?? []) as MapRoom[],
        connections: (conns ?? []) as Array<{ fromRoomId: string; toRoomId: string; type: string }>,
      });
      console.log(`[map] Loaded ${(rooms ?? []).length} rooms for ${mapId}`);
    } catch (err) {
      console.error("[map] Failed to load rooms:", err);
      set({ loading: false });
    }
  },
  setFloor: (floor) => set({ currentFloor: floor }),
  highlightRoom: (roomId) => set({ highlightedRoomId: roomId }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
}));
