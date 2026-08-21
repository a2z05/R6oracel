import { useState } from "react";
import { Map, Search, Clock, Star, Play, Pause, ChevronDown, ChevronRight } from "lucide-react";
import { useOcrStore } from "../../stores/ocr-store.js";
import { useMapStore } from "../../stores/map-store.js";
import { useUIStore } from "../../stores/ui-store.js";
import { useSettingsStore } from "../../stores/settings-store.js";

const MAPS = [
  "bank", "border", "chalet", "clubhouse", "consulate", "fortress",
  "kanal", "kafe-dostoyevsky", "oregon", "outback", "villa", "theme-park",
  "tower", "skyscraper", "yacht", "house", "favela", "lair", "emerald-plain",
];

const MAP_LABELS: Record<string, string> = {
  bank: "Bank", border: "Border", chalet: "Chalet", clubhouse: "Clubhouse",
  consulate: "Consulate", fortress: "Fortress", kanal: "Kanal",
  "kafe-dostoyevsky": "Kafe Dostoyevsky", oregon: "Oregon", outback: "Outback",
  villa: "Villa", "theme-park": "Theme Park", tower: "Tower",
  skyscraper: "Skyscraper", yacht: "Yacht", house: "House", favela: "Favela",
  lair: "Lair", "emerald-plain": "Emerald Plain",
};

const FLOORS = [
  { level: -1, label: "B1" },
  { level: 0, label: "G" },
  { level: 1, label: "1F" },
  { level: 2, label: "2F" },
];

const MODULE_LIST = [
  { key: "spawnPeek", label: "Spawn Peek" },
  { key: "siteSetup", label: "Site Setup" },
  { key: "plantTips", label: "Plant Tips" },
  { key: "rotateRoutes", label: "Rotate Routes" },
  { key: "roomImages", label: "Room Images" },
  { key: "neighborRooms", label: "Neighbor Rooms" },
];

export function Sidebar() {
  const [mapsOpen, setMapsOpen] = useState(true);
  const [modulesOpen, setModulesOpen] = useState(false);
  const isRunning = useOcrStore((s) => s.isRunning);
  const start = useOcrStore((s) => s.start);
  const stop = useOcrStore((s) => s.stop);
  const selectedMapId = useMapStore((s) => s.selectedMapId);
  const currentFloor = useMapStore((s) => s.currentFloor);
  const setMap = useMapStore((s) => s.setMap);
  const setFloor = useMapStore((s) => s.setFloor);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const modules = useSettingsStore((s) => s.modules);
  const toggleModule = useSettingsStore((s) => s.toggleModule);

  return (
    <div className="w-60 h-full flex flex-col bg-[var(--oracle-bg-surface)] border-r border-[var(--oracle-border)] overflow-y-auto shrink-0">
      {/* OCR Control */}
      <div className="p-3 border-b border-[var(--oracle-border)]">
        <button
          onClick={isRunning ? stop : start}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            isRunning
              ? "bg-[var(--oracle-danger)]/20 text-[var(--oracle-danger)] border border-[var(--oracle-danger)]/30"
              : "bg-[var(--oracle-accent)]/20 text-[var(--oracle-accent)] border border-[var(--oracle-accent)]/30"
          }`}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? "Pause OCR" : "Start OCR"}
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[var(--oracle-border)]">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--oracle-text-muted)]" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)] placeholder:text-[var(--oracle-text-muted)] focus:outline-none focus:border-[var(--oracle-accent)]/50 transition-colors"
          />
        </div>
      </div>

      {/* Map Selector */}
      <div className="border-b border-[var(--oracle-border)]">
        <button
          onClick={() => setMapsOpen(!mapsOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--oracle-text-secondary)] uppercase tracking-wider hover:bg-white/5"
        >
          <Map size={12} />
          Maps
          {mapsOpen ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
        </button>
        {mapsOpen && (
          <div className="px-2 pb-2 max-h-48 overflow-y-auto">
            {MAPS.map((id) => (
              <button
                key={id}
                onClick={() => setMap(id)}
                className={`w-full text-left px-2.5 py-1 rounded text-sm transition-colors ${
                  selectedMapId === id
                    ? "bg-[var(--oracle-accent)]/15 text-[var(--oracle-accent)]"
                    : "text-[var(--oracle-text-secondary)] hover:bg-white/5 hover:text-[var(--oracle-text-primary)]"
                }`}
              >
                {MAP_LABELS[id] ?? id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floor Switcher */}
      {selectedMapId && (
        <div className="p-3 border-b border-[var(--oracle-border)]">
          <span className="text-xs font-semibold text-[var(--oracle-text-muted)] uppercase tracking-wider">Floor</span>
          <div className="flex gap-1 mt-2">
            {FLOORS.map((f) => (
              <button
                key={f.level}
                onClick={() => setFloor(f.level)}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                  currentFloor === f.level
                    ? "bg-[var(--oracle-accent)] text-[var(--oracle-bg-primary)]"
                    : "bg-[var(--oracle-bg-primary)] text-[var(--oracle-text-secondary)] hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="border-b border-[var(--oracle-border)]">
        <button
          onClick={() => setModulesOpen(!modulesOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--oracle-text-secondary)] uppercase tracking-wider hover:bg-white/5"
        >
          Modules
          {modulesOpen ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
        </button>
        {modulesOpen && (
          <div className="px-3 pb-3 space-y-1.5">
            {MODULE_LIST.map((m) => (
              <label key={m.key} className="flex items-center gap-2 text-sm text-[var(--oracle-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={modules[m.key] ?? true}
                  onChange={() => toggleModule(m.key)}
                  className="rounded border-[var(--oracle-border-strong)] text-[var(--oracle-accent)] focus:ring-[var(--oracle-accent)]"
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Favorites */}
      <div className="p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--oracle-text-muted)] uppercase tracking-wider">
          <Star size={12} />
          Favorites
        </div>
        <p className="text-xs text-[var(--oracle-text-muted)] mt-2 italic">Right-click a map to favorite</p>
      </div>
    </div>
  );
}
