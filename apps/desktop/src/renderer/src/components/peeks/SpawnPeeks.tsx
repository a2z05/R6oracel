import { useEffect, useState } from "react";
import {
  Crosshair, ExternalLink, X, MapPin, AlertTriangle, Gauge,
  Film, Lightbulb, ChevronDown, ChevronRight,
} from "lucide-react";
import { useUIStore } from "../../stores/ui-store.js";
import { useMapStore } from "../../stores/map-store.js";

interface Peek {
  id: string;
  name: string;
  floorName: string | null;
  floorOrder: number | null;
  birdsEyeUrl: string | null;
  xPct: number | null;
  yPct: number | null;
  instructions: string[];
  tip: string | null;
  difficulty: number | null;
  risk: string | null;
  successRate: number | null;
  votes: number | null;
  mediaUrl: string | null;
  url: string;
}

interface PeeksData {
  ok: boolean;
  available?: boolean;
  mapName?: string;
  error?: string;
  siteUrl?: string;
  peeks?: Peek[];
}

const RISK_COLORS: Record<string, string> = {
  low: "var(--oracle-success)",
  medium: "var(--oracle-warning)",
  high: "var(--oracle-danger)",
};

/** Chamfered corner clip — matches the setup wizard / HUD language. */
const CLIP = "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)";

function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk) return null;
  const color = RISK_COLORS[risk.toLowerCase()] ?? "var(--oracle-text-muted)";
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider"
      style={{ color, backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)", border: `1px solid ${color}` }}
    >
      <AlertTriangle size={9} />
      {risk}
    </span>
  );
}

function SuccessBadge({ rate, votes }: { rate: number | null; votes: number | null }) {
  if (rate === null || rate === undefined) return null;
  const color = rate >= 75 ? "var(--oracle-success)" : rate >= 55 ? "var(--oracle-warning)" : "var(--oracle-danger)";
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px]" style={{ color }} title={`${votes ?? 0} votes`}>
      <Gauge size={10} />
      {rate}%
    </span>
  );
}

function PeekCard({ peek }: { peek: Peek }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card overflow-hidden" style={{ clipPath: CLIP }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Crosshair size={13} className="text-[var(--oracle-accent)] shrink-0" />
        <span className="text-sm font-semibold text-[var(--oracle-text-primary)] truncate">{peek.name}</span>
        {peek.floorName && (
          <span className="hidden sm:inline font-mono text-[9px] text-[var(--oracle-text-muted)] uppercase tracking-wider shrink-0">
            {peek.floorName}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2 shrink-0">
          <SuccessBadge rate={peek.successRate} votes={peek.votes} />
          <RiskBadge risk={peek.risk} />
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[var(--oracle-border)]">
          {/* Birds-eye map with peek position */}
          {peek.birdsEyeUrl && (
            <div className="relative rounded-lg overflow-hidden border border-[var(--oracle-border)] bg-black/40">
              <img src={peek.birdsEyeUrl} alt={`${peek.floorName} floor plan`} className="w-full" loading="lazy" />
              {peek.xPct !== null && peek.yPct !== null && (
                <div
                  className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/30 animate-pulse"
                  style={{ left: `${peek.xPct}%`, top: `${peek.yPct}%` }}
                  aria-hidden
                />
              )}
            </div>
          )}

          {/* Step-by-step instructions */}
          {peek.instructions.length > 0 && (
            <ol className="space-y-1.5">
              {peek.instructions.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--oracle-text-secondary)] leading-relaxed">
                  <span className="font-mono text-[10px] text-[var(--oracle-accent)] mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}

          {peek.tip && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[var(--oracle-accent)]/8 border border-[var(--oracle-accent)]/20">
              <Lightbulb size={12} className="text-[var(--oracle-accent)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--oracle-text-secondary)] italic">{peek.tip}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {peek.difficulty !== null && (
              <span className="font-mono text-[10px] text-[var(--oracle-text-muted)]">
                Difficulty {"◆".repeat(Math.max(1, Math.min(5, Math.round(peek.difficulty))))}
              </span>
            )}
            <a
              href={peek.url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--oracle-accent)] hover:underline cursor-pointer"
            >
              View on peekaboor6 <ExternalLink size={10} />
            </a>
          </div>

          {peek.mediaUrl && /\.(mp4|webm|mov)$/i.test(peek.mediaUrl) && (
            <video src={peek.mediaUrl} controls preload="none" className="w-full rounded-lg border border-[var(--oracle-border)]" />
          )}
        </div>
      )}
    </div>
  );
}

export function SpawnPeeks() {
  const togglePeeks = useUIStore((s) => s.togglePeeks);
  const selectedMapId = useMapStore((s) => s.selectedMapId);
  const [data, setData] = useState<PeeksData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMapId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    window.oracle
      ?.getSpawnPeeks(selectedMapId)
      .then((d) => {
        if (!cancelled) setData(d as PeeksData);
      })
      .catch(() => {
        if (!cancelled) setData({ ok: false, error: "Failed to reach peekaboor6.com" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMapId]);

  const peeks = data?.peeks ?? [];

  return (
    <div className="h-full flex flex-col bg-[var(--oracle-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--oracle-border)] shrink-0">
        <Crosshair size={16} className="text-[var(--oracle-accent)]" />
        <h2 className="text-base font-bold text-[var(--oracle-text-primary)] tracking-wide">
          SPAWN PEEKS{data?.mapName ? ` — ${data.mapName.toUpperCase()}` : ""}
        </h2>
        <button
          onClick={togglePeeks}
          aria-label="Close spawn peeks"
          className="ml-auto p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer text-[var(--oracle-text-secondary)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-2 border-[var(--oracle-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--oracle-text-muted)]">Scanning spawn peeks…</p>
          </div>
        )}

        {!loading && data && !data.ok && (
          <div className="text-center py-16 space-y-2">
            <AlertTriangle size={24} className="mx-auto text-[var(--oracle-danger)]" />
            <p className="text-sm text-[var(--oracle-text-danger, var(--oracle-text-secondary))]">{data.error ?? "Something went wrong."}</p>
          </div>
        )}

        {!loading && data?.ok && !data.available && (
          <div className="text-center py-16 space-y-2 px-6">
            <MapPin size={24} className="mx-auto text-[var(--oracle-text-muted)]" />
            <p className="text-sm text-[var(--oracle-text-secondary)]">No published spawn peeks for this map yet.</p>
            {data.siteUrl && (
              <a href={data.siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--oracle-accent)] hover:underline">
                Check peekaboor6.com <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        {!loading &&
          peeks.map((p) => (
            <PeekCard key={p.id} peek={p} />
          ))}

        {!loading && peeks.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Film size={11} className="text-[var(--oracle-text-muted)]" />
            <p className="text-[11px] text-[var(--oracle-text-muted)]">
              All peek videos, images &amp; data from{" "}
              <a href="https://peekaboor6.com" target="_blank" rel="noreferrer" className="text-[var(--oracle-accent)] hover:underline inline-flex items-center gap-0.5">
                peekaboor6.com <ExternalLink size={9} />
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
