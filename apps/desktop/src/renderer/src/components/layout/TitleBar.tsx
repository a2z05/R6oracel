import { Minus, Square, X, Settings } from "lucide-react";
import { useOcrStore } from "../../stores/ocr-store.js";
import { useUIStore } from "../../stores/ui-store.js";
import { useSettingsStore } from "../../stores/settings-store.js";
import { SideIndicator, type Side } from "../side/SideIndicator.js";

export function TitleBar() {
  const isRunning = useOcrStore((s) => s.isRunning);
  const currentSide = useOcrStore((s) => s.currentSide);
  const iconSet = useSettingsStore((s) => s.sideIconSet);
  const toggleSettings = useUIStore((s) => s.toggleSettings);

  const side: Side = currentSide === "attacker" ? "attack" : currentSide === "defender" ? "defense" : "unknown";

  return (
    <div className="h-10 flex items-center justify-between px-4 bg-[var(--oracle-bg-surface)] border-b border-[var(--oracle-border)] app-region-drag select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-2 app-region-no-drag">
        <img src="./icons/logo.png" alt="ORACLE" className="w-6 h-6 rounded" draggable={false} />
        <span className="font-[var(--oracle-font-heading)] text-sm font-bold tracking-wider text-[var(--oracle-text-primary)]">
          ORACLE
        </span>
        <span className="text-[10px] text-[var(--oracle-text-muted)] ml-1">R6 SIEGE COMPANION</span>
        <span className="text-[9px] text-[var(--oracle-text-muted)]/60 ml-1 font-mono">by Vnerxy</span>
      </div>

      {/* Center: player's team (left) + OCR status */}
      <div className="flex items-center gap-3 app-region-no-drag">
        <SideIndicator side={side} iconSet={iconSet} compact />
        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-[var(--oracle-success)] animate-pulse" : "bg-[var(--oracle-text-muted)]"}`} />
        <span className="text-xs text-[var(--oracle-text-secondary)]">
          {isRunning ? "OCR Active" : "OCR Paused"}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1 app-region-no-drag">
        <button onClick={toggleSettings} aria-label="Open settings" className="p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer" title="Settings">
          <Settings size={14} className="text-[var(--oracle-text-secondary)]" />
        </button>
        <button onClick={() => window.oracle?.minimize()} aria-label="Minimize window" className="p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer" title="Minimize">
          <Minus size={14} className="text-[var(--oracle-text-secondary)]" />
        </button>
        <button onClick={() => window.oracle?.maximize()} aria-label="Maximize window" className="p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer" title="Maximize">
          <Square size={12} className="text-[var(--oracle-text-secondary)]" />
        </button>
        <button onClick={() => window.oracle?.close()} aria-label="Close ORACLE" className="p-1.5 rounded hover:bg-[var(--oracle-danger)]/20 transition-colors cursor-pointer" title="Close">
          <X size={14} className="text-[var(--oracle-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}
