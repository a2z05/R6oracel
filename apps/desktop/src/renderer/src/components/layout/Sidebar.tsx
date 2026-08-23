import { useEffect, useState } from "react";
import { Map, Search, Clock, Star, Play, Pause, ChevronDown, ChevronRight, Download, Check } from "lucide-react";
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
  const [packStatus, setPackStatus] = useState<Record<string, { installed: boolean; error?: string }>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const isRunning = useOcrStore((s) => s.isRunning);
  const start = useOcrStore((s) => s.start);
  const stop = useOcrStore((s) => s.stop);
  const selectedMapId = useMapStore((s) => s.selectedMapId);
  const currentFloor = useMapStore((s) => s.currentFloor);
  const loadMap = useMapStore((s) => s.loadMap);
  const setFloor = useMapStore((s) => s.setFloor);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const modules = useSettingsStore((s) => s.modules);
  const toggleModule = useSettingsStore((s) => s.toggleModule);

  // Load pack install state for all maps
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries: Record<string, { installed: boolean; error?: string }> = {};
      for (const id of MAPS) {
        try {
          entries[id] = (await window.oracle?.invoke("map:pack-status", { mapId: id })) as never;
        } catch {
          entries[id] = { installed: false };
        }
      }
      if (!cancelled) setPackStatus(entries);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadPack = async (id: string) => {
    setDownloading(id);
    try {
      const result = (await window.oracle?.invoke("map:pack-download", { mapId: id })) as {
        ok: boolean; rooms?: number; error?: string;
      };
      setPackStatus((prev) => ({
        ...prev,
        [id]: result.ok
          ? { installed: true }
          : { installed: false, error: result.error ?? "Download failed" },
      }));
      if (result.ok) void loadMap(id);
    } catch {
      setPackStatus((prev) => ({ ...prev, [id]: { installed: false, error: "Download failed" } }));
    } finally {
      setDownloading(null);
    }
  };

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

      {/* Map Selector — each map shows its thumbnail + name */}
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
          <div className="px-2 pb-2 max-h-72 overflow-y-auto space-y-1">
            {MAPS.map((id) => {
              const pack = packStatus[id];
              const isDownloading = downloading === id;
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void loadMap(id)}
                  onKeyDown={(e) => e.key === "Enter" && void loadMap(id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${
                    selectedMapId === id
                      ? "bg-[var(--oracle-accent)]/15"
                      : "hover:bg-white/5"
                  }`}
                >
                  <img
                    src={`./maps/${id}.png`}
                    alt=""
                    className="w-8 h-8 rounded border border-[var(--oracle-border)] shrink-0"
                    draggable={false}
                  />
                  <span
                    className={`flex-1 text-left text-sm truncate ${
                      selectedMapId === id
                        ? "text-[var(--oracle-accent)] font-medium"
                        : "text-[var(--oracle-text-secondary)] group-hover:text-[var(--oracle-text-primary)]"
                    }`}
                  >
                    {MAP_LABELS[id] ?? id}
                  </span>
                  {pack?.installed ? (
                    <Check size={13} className="text-[var(--oracle-success)] shrink-0" />
                  ) : (
                    <button
                      aria-label={pack?.error ? `Map data failed: ${pack.error}` : `Download ${MAP_LABELS[id] ?? id} callout data`}
                      title={pack?.error ?? "Download callout data"}
                      disabled={isDownloading}
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPack(id);
                      }}
                      className={`p-1 rounded shrink-0 transition-colors cursor-pointer ${
                        isDownloading
                          ? "opacity-50"
                          : "opacity-40 hover:opacity-100 hover:bg-white/10"
                      }`}
                    >
                      {isDownloading ? (
                        <span className="block w-3 h-3 border-[1.5px] border-[var(--oracle-accent)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download size={13} className={pack?.error ? "text-[var(--oracle-danger)]" : "text-[var(--oracle-text-secondary)]"} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
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
