import { create } from "zustand";

type Panel = "map" | "settings" | "search" | "history";

interface UIStore {
  activePanel: Panel;
  searchQuery: string;
  sidebarCollapsed: boolean;
  showSettings: boolean;
  setActivePanel: (panel: Panel) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activePanel: "map",
  searchQuery: "",
  sidebarCollapsed: false,
  showSettings: false,
  setActivePanel: (panel) => set({ activePanel: panel }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
}));
