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
  rooms: MapRoom[];
  connections: Array<{ fromRoomId: string; toRoomId: string; type: string }>;
  highlightedRoomId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  setMap: (mapId: string) => void;
  setFloor: (floor: number) => void;
  setRooms: (rooms: MapRoom[]) => void;
  setConnections: (conns: Array<{ fromRoomId: string; toRoomId: string; type: string }>) => void;
  highlightRoom: (roomId: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  selectedMapId: null,
  currentFloor: 0,
  rooms: [],
  connections: [],
  highlightedRoomId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  setMap: (mapId) => set({ selectedMapId: mapId, currentFloor: 0, highlightedRoomId: null, zoom: 1, pan: { x: 0, y: 0 } }),
  setFloor: (floor) => set({ currentFloor: floor }),
  setRooms: (rooms) => set({ rooms }),
  setConnections: (conns) => set({ connections: conns }),
  highlightRoom: (roomId) => set({ highlightedRoomId: roomId }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
}));
