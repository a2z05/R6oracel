import { create } from "zustand";
import type { ThemeId } from "@oracle/ui-tokens";

interface SettingsStore {
  theme: ThemeId;
  accentColor: string;
  overlayOpacity: number;
  overlayScale: number;
  overlayBlur: number;
  ocrInterval: number;
  ocrSensitivity: number;
  debugMode: boolean;
  modules: Record<string, boolean>;
  teamColor: string;
  compassPreset: string;
  setTheme: (theme: ThemeId) => void;
  setAccentColor: (color: string) => void;
  setOverlayOpacity: (v: number) => void;
  setOverlayScale: (v: number) => void;
  setOverlayBlur: (v: number) => void;
  setOcrInterval: (v: number) => void;
  setOcrSensitivity: (v: number) => void;
  setDebugMode: (v: boolean) => void;
  toggleModule: (name: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: "siege-classic",
  accentColor: "#f0b132",
  overlayOpacity: 0.9,
  overlayScale: 1.0,
  overlayBlur: 12,
  ocrInterval: 250,
  ocrSensitivity: 60,
  debugMode: false,
  modules: { spawnPeek: true, siteSetup: true, plantTips: true, rotateRoutes: true, roomImages: true, neighborRooms: true, operatorTips: true },
  teamColor: "#9944ff",
  compassPreset: "bottom-center",
  setTheme: (theme) => set({ theme }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
  setOverlayScale: (overlayScale) => set({ overlayScale }),
  setOverlayBlur: (overlayBlur) => set({ overlayBlur }),
  setOcrInterval: (ocrInterval) => set({ ocrInterval }),
  setOcrSensitivity: (ocrSensitivity) => set({ ocrSensitivity }),
  setDebugMode: (debugMode) => set({ debugMode }),
  toggleModule: (name) => set((s) => ({ modules: { ...s.modules, [name]: !s.modules[name] } })),
  setTeamColor: (teamColor) => set({ teamColor }),
  setCompassPreset: (compassPreset) => set({ compassPreset }),
}));
