import { MapCanvas } from "./MapCanvas.js";
import { FloorSwitcher } from "./FloorSwitcher.js";
import { ZoomControls } from "./ZoomControls.js";
import { useMapStore } from "../../stores/map-store.js";

export function TacticalMap() {
  const selectedMapId = useMapStore((s) => s.selectedMapId);
  const currentFloor = useMapStore((s) => s.currentFloor);
  const loading = useMapStore((s) => s.loading);
  const rooms = useMapStore((s) => s.rooms);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--oracle-bg-primary)]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-[var(--oracle-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--oracle-text-muted)]">Loading map…</p>
        </div>
      </div>
    );
  }

  if (selectedMapId && rooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--oracle-bg-primary)]">
        <div className="text-center px-6">
          <img src="./icons/logo.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50 rounded-xl" draggable={false} />
          <h3 className="text-lg font-semibold text-[var(--oracle-text-primary)] mb-1">No map data</h3>
          <p className="text-sm text-[var(--oracle-text-muted)] max-w-xs">
            Detailed floor plans for this map aren't available yet. Room detection still works via OCR.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedMapId) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--oracle-bg-primary)]">
        <div className="text-center">
          <img src="./icons/logo.png" alt="" className="w-20 h-20 mx-auto mb-4 rounded-2xl opacity-80" draggable={false} />
          <h3 className="text-lg font-semibold text-[var(--oracle-text-primary)] mb-1">Select a Map</h3>
          <p className="text-sm text-[var(--oracle-text-muted)]">Choose a map from the sidebar to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-[var(--oracle-bg-primary)]">
      <MapCanvas />
      <FloorSwitcher />
      <ZoomControls />
      {/* Map label */}
      <div className="absolute top-3 left-3 glass-card px-3 py-1.5">
        <span className="text-xs font-semibold text-[var(--oracle-accent)] uppercase tracking-wider">
          {selectedMapId.replace(/-/g, " ")} — Floor {currentFloor === -1 ? "B1" : currentFloor === 0 ? "G" : `${currentFloor}F`}
        </span>
      </div>
    </div>
  );
}
