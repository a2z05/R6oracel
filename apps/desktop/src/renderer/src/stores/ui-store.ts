import { create } from "zustand";

type Panel = "map" | "settings" | "search" | "history";

export type IntelTab = "operators" | "weapons" | "operations" | "locations";

interface UIStore {
  activePanel: Panel;
  searchQuery: string;
  sidebarCollapsed: boolean;
  showSettings: boolean;
  showIntel: boolean;
  showPeeks: boolean;
  intelTab: IntelTab;
  setActivePanel: (panel: Panel) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  toggleIntel: () => void;
  togglePeeks: () => void;
  setIntelTab: (tab: IntelTab) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: "map",
  searchQuery: "",
  sidebarCollapsed: false,
  showSettings: false,
  showIntel: false,
  showPeeks: false,
  intelTab: "operators",
  setActivePanel: (panel) => set({ activePanel: panel }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  toggleIntel: () => set((s) => ({ showIntel: !s.showIntel, showSettings: false, showPeeks: false })),
  togglePeeks: () => set((s) => ({ showPeeks: !s.showPeeks, showSettings: false, showIntel: false })),
  setIntelTab: (tab) => set({ intelTab: tab }),
}));
