import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
import { useMapStore } from "../../stores/map-store.js";

export function ZoomControls() {
  const zoom = useMapStore((s) => s.zoom);
  const setZoom = useMapStore((s) => s.setZoom);
  const resetView = useMapStore((s) => s.resetView);

  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1 glass-card p-1">
      <button onClick={() => setZoom(zoom + 0.2)} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Zoom in">
        <ZoomIn size={14} className="text-[var(--oracle-text-secondary)]" />
      </button>
      <button onClick={() => setZoom(zoom - 0.2)} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Zoom out">
        <ZoomOut size={14} className="text-[var(--oracle-text-secondary)]" />
      </button>
      <div className="h-px bg-[var(--oracle-border)]" />
      <button onClick={resetView} className="p-1.5 rounded hover:bg-white/10 transition-colors" title="Reset view">
        <RotateCcw size={14} className="text-[var(--oracle-text-secondary)]" />
      </button>
      <span className="text-[10px] text-center text-[var(--oracle-text-muted)] py-0.5">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
