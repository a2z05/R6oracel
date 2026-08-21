import { MapCanvas } from "./MapCanvas.js";
import { FloorSwitcher } from "./FloorSwitcher.js";
import { ZoomControls } from "./ZoomControls.js";
import { useMapStore } from "../../stores/map-store.js";

export function TacticalMap() {
  const selectedMapId = useMapStore((s) => s.selectedMapId);
  const currentFloor = useMapStore((s) => s.currentFloor);

  if (!selectedMapId) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--oracle-bg-primary)]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[var(--oracle-accent)]/10 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--oracle-accent)]">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
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
