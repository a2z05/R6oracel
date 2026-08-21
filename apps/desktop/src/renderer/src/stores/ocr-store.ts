import { create } from "zustand";
import type { OcrResult } from "../../../../packages/domain/src/ocr.js";

interface OcrStore {
  isRunning: boolean;
  currentText: string | null;
  currentRoomId: string | null;
  currentMapId: string | null;
  confidence: number;
  history: OcrResult[];
  start: () => void;
  stop: () => void;
  setResult: (result: OcrResult) => void;
  clearHistory: () => void;
}

export const useOcrStore = create<OcrStore>((set) => ({
  isRunning: false,
  currentText: null,
  currentRoomId: null,
  currentMapId: null,
  confidence: 0,
  history: [],
  start: () => {
    window.oracle?.startOcr(250);
    set({ isRunning: true });
  },
  stop: () => {
    window.oracle?.stopOcr();
    set({ isRunning: false });
  },
  setResult: (result) =>
    set((state) => ({
      currentText: result.rawText,
      currentRoomId: result.roomId,
      currentMapId: result.mapId ?? state.currentMapId,
      confidence: result.confidence,
      history: [result, ...state.history].slice(0, 50),
    })),
  clearHistory: () => set({ history: [] }),
}));
