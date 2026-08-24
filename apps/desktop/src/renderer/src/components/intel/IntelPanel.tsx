import { useEffect, useMemo, useState } from "react";
import {
  Users, Crosshair, CalendarDays, Map as MapIcon,
  ChevronDown, ChevronRight, X, ExternalLink, Shield, Sword,
} from "lucide-react";
import { useUIStore, type IntelTab } from "../../stores/ui-store.js";
import {
  loadOperators, loadWeapons, loadRainbowSix, loadLocations, isKnown,
  type Operator, type Weapon, type Operation, type LocationInfo,
} from "./r6intel-data.js";

const TABS: Array<{ id: IntelTab; label: string; icon: React.ReactNode }> = [
  { id: "operators", label: "Operators", icon: <Users size={13} /> },
  { id: "weapons", label: "Arsenal", icon: <Crosshair size={13} /> },
  { id: "operations", label: "Operations", icon: <CalendarDays size={13} /> },
  { id: "locations", label: "Locations", icon: <MapIcon size={13} /> },
];

/** Attribution banner — r6calls.com is the source of ALL data in this panel. */
function Attribution() {
  return (
    <div className="mx-4 mb-3 px-3 py-2 rounded-lg border border-[var(--oracle-border)] bg-[var(--oracle-bg-surface)]/60 flex items-center gap-2 shrink-0">
      <Shield size={12} className="text-[var(--oracle-accent)] shrink-0" />
      <p className="text-[11px] text-[var(--oracle-text-muted)] leading-snug">
        All data in this section is from{" "}
        <a
          href="https://www.r6calls.com"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--oracle-accent)] hover:underline inline-flex items-center gap-0.5"
        >
          r6calls.com <ExternalLink size={9} />
        </a>{" "}
        — ORACLE is a separate app and simply reuses their open data. Credit and thanks to the r6calls team.
      </p>
    </div>
  );
}

function Collapsible({ title, defaultOpen = false, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-[var(--oracle-border)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--oracle-text-secondary)] hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {title}
      </button>
      {open && <div className="px-4 pb-3 pt-1 space-y-2">{children}</div>}
    </div>
  );
}

const SideBadge = ({ side }: { side: "attackers" | "defenders" }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider ${
      side === "attackers"
        ? "bg-[var(--oracle-danger)]/15 text-[var(--oracle-danger)]"
        : "bg-[var(--oracle-info)]/15 text-[var(--oracle-info)]"
    }`}
  >
    {side === "attackers" ? <Sword size={9} /> : <Shield size={9} />}
    {side === "attackers" ? "ATK" : "DEF"}
  </span>
);

// ─── Operators ───────────────────────────────────────────────────────

function FullBodyPortrait({ nickName }: { nickName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={`https://www.r6calls.com/img/operators/${encodeURIComponent(nickName)}/fullBody.webp`}
      alt={nickName}
      loading="lazy"
      onError={() => setFailed(true)}
      className="max-h-56 w-auto rounded-lg border border-[var(--oracle-border)] bg-black/20 object-contain"
      draggable={false}
    />
  );
}

function OperatorAvatar({ nickName, size = 28 }: { nickName: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={`https://www.r6calls.com/img/operators/${encodeURIComponent(nickName)}/avatar.webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded shrink-0 border border-[var(--oracle-border)] object-cover"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

function OperatorCard({ op }: { op: Operator }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--oracle-border)] bg-[var(--oracle-bg-surface)]/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        <OperatorAvatar nickName={op.nickName} size={28} />
        <SideBadge side={op.side} />
        <span className="text-sm font-semibold text-[var(--oracle-text-primary)]">{op.nickName}</span>
        <span className="text-xs text-[var(--oracle-text-muted)] truncate">
          {isKnown(op.organization) ? op.organization : ""}
        </span>
        <span className="ml-auto text-xs text-[var(--oracle-text-muted)]">{isKnown(op.country) ? op.country : ""}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 space-y-3 border-t border-[var(--oracle-border)]">
          {/* Full body portrait — r6calls.com */}
          <div className="flex justify-center py-2">
            <FullBodyPortrait nickName={op.nickName} />
          </div>
          {isKnown(op.quote) && (
            <p className="text-xs italic text-[var(--oracle-text-muted)]">"{op.quote.replace(/^"|"$/g, "")}"</p>
          )}
          {(isKnown(op.age) || isKnown(op.height) || isKnown(op.weight)) && (
            <p className="font-mono text-[10px] text-[var(--oracle-text-secondary)]">
              {[op.age && isKnown(op.age) ? `Age ${op.age}` : null, isKnown(op.height) ? op.height : null, isKnown(op.weight) ? op.weight : null]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          )}
          {op.biographyParagraphs?.map((p, i) => (
            <p key={i} className="text-xs text-[var(--oracle-text-secondary)] leading-relaxed">{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function OperatorsTab() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | "attackers" | "defenders">("all");
  const [error, setError] = useState(false);

  useEffect(() => {
    loadOperators().then(setOperators).catch(() => setError(true));
  }, []);

  const filtered = useMemo(
    () =>
      operators.filter(
        (o) =>
          (sideFilter === "all" || o.side === sideFilter) &&
          o.nickName.toLowerCase().includes(query.toLowerCase()),
      ),
    [operators, query, sideFilter],
  );

  if (error) return <p className="text-sm text-[var(--oracle-danger)]">Failed to load operator data.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search operators…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-40 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)] placeholder:text-[var(--oracle-text-muted)] focus:outline-none focus:border-[var(--oracle-accent)]/50"
        />
        {(["all", "attackers", "defenders"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSideFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              sideFilter === s
                ? s === "attackers"
                  ? "bg-[var(--oracle-danger)]/20 text-[var(--oracle-danger)] border border-[var(--oracle-danger)]/30"
                  : s === "defenders"
                    ? "bg-[var(--oracle-info)]/20 text-[var(--oracle-info)] border border-[var(--oracle-info)]/30"
                    : "bg-[var(--oracle-accent)]/20 text-[var(--oracle-accent)] border border-[var(--oracle-accent)]/30"
                : "bg-[var(--oracle-bg-primary)] text-[var(--oracle-text-secondary)] border border-[var(--oracle-border)] hover:bg-white/5"
            }`}
          >
            {s === "all" ? "All" : s === "attackers" ? "ATK" : "DEF"}
          </button>
        ))}
        <span className="font-mono text-[10px] text-[var(--oracle-text-muted)]">{filtered.length}</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        {filtered.map((op) => (
          <OperatorCard key={op.nickName} op={op} />
        ))}
      </div>
    </div>
  );
}

// ─── Arsenal ─────────────────────────────────────────────────────────

function ArsenalTab() {
  const [data, setData] = useState<{ weapons: Weapon[]; gadgets: Array<Weapon & { type: string }>; types: Array<{ id: string; name: string }> } | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    loadWeapons().then(setData).catch(() => setError(true));
  }, []);

  if (error || !data) return <p className="text-sm text-[var(--oracle-danger)]">Failed to load arsenal data.</p>;

  const q = query.toLowerCase();
  const weapons = data.weapons.filter((w) => w.name.toLowerCase().includes(q));
  const gadgets = data.gadgets.filter((g) => g.name.toLowerCase().includes(q));

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search weapons & gadgets…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)] placeholder:text-[var(--oracle-text-muted)] focus:outline-none focus:border-[var(--oracle-accent)]/50"
      />
      <Collapsible title={`Primary & Secondary Weapons (${weapons.length})`} defaultOpen>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {weapons.map((w) => (
            <Collapsible key={w.name} title={w.name}>
              <p className="font-mono text-[10px] text-[var(--oracle-accent)] uppercase tracking-wider">{w.type}</p>
              {isKnown(w.country ?? "") && <p className="text-[11px] text-[var(--oracle-text-muted)]">{w.country}</p>}
              {w.descriptionParagraphs?.map((p, i) => (
                <p key={i} className="text-xs text-[var(--oracle-text-secondary)] leading-relaxed">{p}</p>
              ))}
            </Collapsible>
          ))}
        </div>
      </Collapsible>
      <Collapsible title={`Gadgets (${gadgets.length})`}>
        <div className="space-y-2">
          {gadgets.map((g) => (
            <div key={g.name} className="rounded-lg border border-[var(--oracle-border)] p-3">
              <p className="text-sm font-semibold text-[var(--oracle-text-primary)]">{g.name}</p>
              <p className="font-mono text-[10px] text-[var(--oracle-accent)] uppercase tracking-wider mt-0.5">{g.type}</p>
              {g.descriptionParagraphs?.map((p, i) => (
                <p key={i} className="text-xs text-[var(--oracle-text-secondary)] leading-relaxed mt-1.5">{p}</p>
              ))}
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

// ─── Operations ──────────────────────────────────────────────────────

function OperationsTab() {
  const [data, setData] = useState<{ operations: Operation[] } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadRainbowSix().then(setData).catch(() => setError(true));
  }, []);

  if (error || !data) return <p className="text-sm text-[var(--oracle-danger)]">Failed to load operations data.</p>;

  const byYear = [...data.operations].sort((a, b) => b.year - a.year || b.season - a.season)
    .reduce<Record<number, Operation[]>>((acc, op) => {
      (acc[op.year] ??= []).push(op);
      return acc;
    }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byYear).map(([year, ops]) => (
        <Collapsible key={year} title={`Year ${year}`} defaultOpen={Number(year) >= 2024}>
          <div className="space-y-2">
            {ops.map((op) => (
              <div key={op.id} className="rounded-lg border border-[var(--oracle-border)] p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: op.color || "var(--oracle-accent)" }}
                  />
                  <p className="text-sm font-semibold text-[var(--oracle-text-primary)]">{op.name}</p>
                  <span className="ml-auto font-mono text-[10px] text-[var(--oracle-text-muted)]">
                    S{op.season}
                  </span>
                </div>
                {op.doc && <p className="text-xs text-[var(--oracle-text-secondary)] leading-relaxed mt-1.5">{op.doc}</p>}
              </div>
            ))}
          </div>
        </Collapsible>
      ))}
    </div>
  );
}

// ─── Locations ───────────────────────────────────────────────────────

function LocationsTab() {
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    loadLocations().then(setLocations).catch(() => setError(true));
  }, []);

  if (error) return <p className="text-sm text-[var(--oracle-danger)]">Failed to load location data.</p>;

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      (l.country ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search locations…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)] placeholder:text-[var(--oracle-text-muted)] focus:outline-none focus:border-[var(--oracle-accent)]/50"
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        {filtered.map((l) => (
          <div key={l.id} className="rounded-lg border border-[var(--oracle-border)] bg-[var(--oracle-bg-surface)]/40 p-3">
            <div className="flex items-center gap-2">
              <MapIcon size={12} className="text-[var(--oracle-accent)] shrink-0" />
              <p className="text-sm font-semibold text-[var(--oracle-text-primary)]">{l.name}</p>
              {isKnown(l.country) && (
                <span className="ml-auto text-[11px] text-[var(--oracle-text-muted)]">
                  {[l.town && isKnown(l.town) ? l.town : null, l.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
            {l.doc && <p className="text-xs text-[var(--oracle-text-secondary)] leading-relaxed mt-1.5">{l.doc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panel shell ─────────────────────────────────────────────────────

export function IntelPanel() {
  const toggleIntel = useUIStore((s) => s.toggleIntel);
  const intelTab = useUIStore((s) => s.intelTab);
  const setIntelTab = useUIStore((s) => s.setIntelTab);

  return (
    <div className="h-full flex flex-col bg-[var(--oracle-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--oracle-border)] shrink-0">
        <h2 className="text-base font-bold text-[var(--oracle-text-primary)] tracking-wide">R6 INTEL</h2>
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setIntelTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                intelTab === t.id
                  ? "bg-[var(--oracle-accent)]/20 text-[var(--oracle-accent)] border border-[var(--oracle-accent)]/30"
                  : "text-[var(--oracle-text-secondary)] hover:bg-white/5 border border-transparent"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleIntel}
          aria-label="Close R6 Intel"
          className="ml-auto p-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer text-[var(--oracle-text-secondary)]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Attribution — required credit */}
      <div className="pt-3" />

      <Attribution />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {intelTab === "operators" && <OperatorsTab />}
        {intelTab === "weapons" && <ArsenalTab />}
        {intelTab === "operations" && <OperationsTab />}
        {intelTab === "locations" && <LocationsTab />}
      </div>
    </div>
  );
}
