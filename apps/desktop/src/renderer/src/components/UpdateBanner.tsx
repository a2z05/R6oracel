import { useState, useEffect } from "react";
import { Download, RefreshCw, Check, X, AlertCircle } from "lucide-react";

interface BannerState {
  visible: boolean;
  status: UpdateStatus;
}

interface UpdateStatus {
  state: "checking" | "available" | "up-to-date" | "downloading" | "downloaded" | "error";
  version?: string;
  percent?: number;
  message?: string;
}

export function UpdateBanner() {
  const [banner, setBanner] = useState<BannerState>({ visible: false, status: { state: "checking" } });

  useEffect(() => {
    const unsub = window.oracle?.onUpdateStatus((status) => {
      // Don't show banner for "up-to-date" — silently ignore
      if (status.state === "up-to-date") {
        setBanner({ visible: false, status });
        return;
      }
      setBanner({ visible: true, status });
    });
    return () => unsub?.();
  }, []);

  const dismiss = () => setBanner((b) => ({ ...b, visible: false }));

  if (!banner.visible) return null;

  const { status } = banner;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div className="glass-card px-4 py-3 flex items-center gap-3 shadow-lg min-w-[360px]">
        {/* Icon */}
        <div className="shrink-0">
          {status.state === "checking" && <RefreshCw size={16} className="text-[var(--oracle-info)] animate-spin" />}
          {status.state === "available" && <Download size={16} className="text-[var(--oracle-accent)]" />}
          {status.state === "downloading" && <Download size={16} className="text-[var(--oracle-accent)] animate-bounce" />}
          {status.state === "downloaded" && <Check size={16} className="text-[var(--oracle-success)]" />}
          {status.state === "error" && <AlertCircle size={16} className="text-[var(--oracle-danger)]" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {status.state === "checking" && (
            <span className="text-sm text-[var(--oracle-text-secondary)]">Checking for updates...</span>
          )}
          {status.state === "available" && (
            <div>
              <span className="text-sm font-semibold text-[var(--oracle-text-primary)]">
                Update v{status.version} available
              </span>
              <span className="text-xs text-[var(--oracle-text-muted)] block">Downloading...</span>
            </div>
          )}
          {status.state === "downloading" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-[var(--oracle-text-primary)]">Downloading v{status.version}</span>
                <span className="text-xs text-[var(--oracle-accent)]">{status.percent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--oracle-bg-primary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--oracle-accent)] transition-all duration-300"
                  style={{ width: `${status.percent ?? 0}%` }}
                />
              </div>
            </div>
          )}
          {status.state === "downloaded" && (
            <span className="text-sm text-[var(--oracle-text-primary)]">
              Update ready! Restart to install.
            </span>
          )}
          {status.state === "error" && (
            <span className="text-sm text-[var(--oracle-danger)]">
              Update failed: {status.message}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {status.state === "downloaded" && (
            <button
              onClick={() => window.oracle?.installUpdate()}
              className="px-3 py-1 rounded-md bg-[var(--oracle-accent)] text-[var(--oracle-bg-primary)] text-xs font-semibold hover:bg-[var(--oracle-accent-strong)] transition-colors"
            >
              Restart & Install
            </button>
          )}
          {status.state === "error" && (
            <button
              onClick={() => window.oracle?.checkForUpdates()}
              className="px-3 py-1 rounded-md bg-[var(--oracle-bg-surface)] border border-[var(--oracle-border)] text-xs text-[var(--oracle-text-secondary)] hover:bg-white/5 transition-colors"
            >
              Retry
            </button>
          )}
          <button onClick={dismiss} className="p-1 rounded hover:bg-white/5 transition-colors">
            <X size={12} className="text-[var(--oracle-text-muted)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
