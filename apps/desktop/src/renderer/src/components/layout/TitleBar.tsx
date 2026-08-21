import { Minus, Square, X, Scan, Settings } from "lucide-react";
import { useOcrStore } from "../../stores/ocr-store.js";
import { useUIStore } from "../../stores/ui-store.js";

export function TitleBar() {
  const isRunning = useOcrStore((s) => s.isRunning);
  const toggleSettings = useUIStore((s) => s.toggleSettings);

  return (
    <div className="h-10 flex items-center justify-between px-4 bg-[var(--oracle-bg-surface)] border-b border-[var(--oracle-border)] app-region-drag select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-2 app-region-no-drag">
        <div className="w-6 h-6 rounded bg-[var(--oracle-accent)] flex items-center justify-center">
          <Scan size={14} className="text-[var(--oracle-bg-primary)]" />
        </div>
        <span className="font-[var(--oracle-font-heading)] text-sm font-bold tracking-wider text-[var(--oracle-text-primary)]">
          ORACLE
        </span>
        <span className="text-[10px] text-[var(--oracle-text-muted)] ml-1">R6 SIEGE COMPANION</span>
      </div>

      {/* Center: OCR status */}
      <div className="flex items-center gap-2 app-region-no-drag">
        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-[var(--oracle-success)] animate-pulse" : "bg-[var(--oracle-text-muted)]"}`} />
        <span className="text-xs text-[var(--oracle-text-secondary)]">
          {isRunning ? "OCR Active" : "OCR Paused"}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1 app-region-no-drag">
        <button onClick={toggleSettings} className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Settings">
          <Settings size={14} className="text-[var(--oracle-text-secondary)]" />
        </button>
        <button onClick={() => window.oracle?.minimize()} className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Minimize">
          <Minus size={14} className="text-[var(--oracle-text-secondary)]" />
        </button>
        <button onClick={() => window.oracle?.maximize()} className="p-1.5 rounded hover:bg-white/5 transition-colors" title="Maximize">
          <Square size={12} className="text-[var(--oracle-text-secondary)]" />
        </button>
        <button onClick={() => window.oracle?.close()} className="p-1.5 rounded hover:bg-[var(--oracle-danger)]/20 transition-colors" title="Close">
          <X size={14} className="text-[var(--oracle-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}
