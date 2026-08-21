import { useOcrStore } from "../../stores/ocr-store.js";

export function StatusBar() {
  const confidence = useOcrStore((s) => s.confidence);
  const currentText = useOcrStore((s) => s.currentText);
  const isRunning = useOcrStore((s) => s.isRunning);

  return (
    <div className="h-7 flex items-center justify-between px-4 bg-[var(--oracle-bg-surface)] border-t border-[var(--oracle-border)] text-[11px] text-[var(--oracle-text-muted)] select-none">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-[var(--oracle-success)]" : "bg-[var(--oracle-text-muted)]"}`} />
          OCR {isRunning ? "Running" : "Stopped"}
        </span>
        {isRunning && (
          <>
            <span>
              Confidence:{" "}
              <span className={confidence > 80 ? "text-[var(--oracle-success)]" : confidence > 50 ? "text-[var(--oracle-warning)]" : "text-[var(--oracle-danger)]"}>
                {Math.round(confidence)}%
              </span>
            </span>
            <span>
              Detected: <span className="text-[var(--oracle-text-secondary)]">{currentText || "—"}</span>
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>ORACLE v0.1.0</span>
      </div>
    </div>
  );
}
