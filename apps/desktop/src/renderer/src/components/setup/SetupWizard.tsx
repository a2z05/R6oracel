import { useState } from "react";
import { Crosshair, Palette, Monitor, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useSettingsStore } from "../../stores/settings-store.js";

const STEPS = [
  { id: "welcome", label: "Briefing", icon: null },
  { id: "team", label: "Team Color", icon: <Palette size={13} /> },
  { id: "compass", label: "Calibrate", icon: <Crosshair size={13} /> },
  { id: "overlay", label: "Overlay", icon: <Monitor size={13} /> },
  { id: "done", label: "Ready", icon: <Check size={13} /> },
] as const;

const TEAM_PRESETS = [
  { label: "Blue", color: "#4488ff" },
  { label: "Orange", color: "#ff8c00" },
  { label: "Purple", color: "#9944ff" },
  { label: "Green", color: "#44cc44" },
  { label: "Yellow", color: "#ffcc00" },
  { label: "Red", color: "#ff4444" },
];

const COMPASS_PRESETS = [
  { label: "Bottom Center", region: { x: 35, y: 88, width: 30, height: 8 }, desc: "Default R6 layout" },
  { label: "Top Center", region: { x: 35, y: 2, width: 30, height: 6 }, desc: "Custom HUD positions" },
];

const ANCHORS = [
  { id: "bottom-center", label: "Above Compass" },
  { id: "top-center", label: "Top Center" },
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
];

/** Chamfered panel corner — signature HUD detail */
function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-5 h-5 border-[var(--oracle-accent)] pointer-events-none";
  const map = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  };
  return <div className={`${base} ${map[pos]}`} aria-hidden />;
}

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const s = useSettingsStore();
  const step = STEPS[stepIndex];

  const next = () => (stepIndex < STEPS.length - 1 ? setStepIndex(stepIndex + 1) : onComplete());
  const back = () => setStepIndex(Math.max(0, stepIndex - 1));

  const pickAnchor = (id: string) => {
    s.setOverlayAnchor(id);
    void window.oracle?.invoke("overlay:anchor", { anchor: id });
  };

  return (
    <div className="h-screen w-screen bg-[var(--oracle-bg-primary)] flex items-center justify-center relative overflow-hidden">
      {/* Ambient grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(var(--oracle-accent) 1px, transparent 1px), linear-gradient(90deg, var(--oracle-accent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-xl mx-4">
        {/* Step rail */}
        <div className="flex items-center justify-between mb-4 px-1">
          {STEPS.map((t, i) => (
            <div key={t.id} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] border transition-colors ${
                  i === stepIndex
                    ? "border-[var(--oracle-accent)] text-[var(--oracle-accent)] bg-[var(--oracle-accent)]/10"
                    : i < stepIndex
                      ? "border-[var(--oracle-accent)]/50 text-[var(--oracle-accent)]/70"
                      : "border-[var(--oracle-border-strong)] text-[var(--oracle-text-muted)]"
                }`}
              >
                {i < stepIndex ? <Check size={11} /> : String(i + 1).padStart(2, "0")}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < stepIndex ? "bg-[var(--oracle-accent)]/50" : "bg-[var(--oracle-border-strong)]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div
          className="relative glass-card p-8"
          style={{ clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)" }}
        >
          <Bracket pos="tl" /><Bracket pos="br" />

          {/* Header */}
          <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--oracle-accent)] uppercase mb-1">
            ORACLE // Setup {step.label}
          </p>
          <h1 className="font-[var(--oracle-font-heading)] text-2xl font-bold tracking-wide text-[var(--oracle-text-primary)] mb-6">
            {stepIndex === 0 && "Mission Briefing"}
            {stepIndex === 1 && "Identify Your Team"}
            {stepIndex === 2 && "Locate The Compass"}
            {stepIndex === 3 && "Position The Overlay"}
            {stepIndex === 4 && "All Systems Ready"}
          </h1>

          {/* Step content */}
          {stepIndex === 0 && (
            <div className="space-y-4 text-sm text-[var(--oracle-text-secondary)] leading-relaxed">
              <img src="./icons/logo.png" alt="" className="w-14 h-14 rounded-lg mb-2" draggable={false} />
              <p>ORACLE reads the room name from your game's compass and shows callouts on a second screen or overlay.</p>
              <ul className="space-y-1.5 font-mono text-xs text-[var(--oracle-text-muted)]">
                <li><span className="text-[var(--oracle-accent)]">01</span> — Pick your team color</li>
                <li><span className="text-[var(--oracle-accent)]">02</span> — Point ORACLE at your compass</li>
                <li><span className="text-[var(--oracle-accent)]">03</span> — Choose where the overlay sits</li>
              </ul>
              <p className="text-xs text-[var(--oracle-text-muted)]">
                Created by <a href="https://github.com/a2z05/R6oracel" target="_blank" rel="noreferrer" className="text-[var(--oracle-accent)] hover:underline">Vnerxy</a>.
                Map data inspired by r6peekaboo, r6callouts &amp; siegecodex.com. Takes under a minute — everything is changeable later in Settings.
              </p>
            </div>
          )}

          {stepIndex === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--oracle-text-secondary)]">
                Match your in-game team color so ORACLE knows if you're attacking or defending.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TEAM_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => s.setTeamColor(p.color)}
                    className={`py-3 px-2 rounded-lg border transition-all cursor-pointer hover:bg-white/5 ${
                      s.teamColor === p.color ? "border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/10" : "border-[var(--oracle-border)]"
                    }`}
                  >
                    <span className="block w-5 h-5 rounded-full mx-auto mb-1.5 ring-1 ring-white/20" style={{ backgroundColor: p.color }} />
                    <span className="font-mono text-[10px] tracking-wider text-[var(--oracle-text-secondary)]">{p.label.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-xs text-[var(--oracle-text-muted)] pt-1">
                Custom:
                <input type="color" value={s.teamColor} onChange={(e) => s.setTeamColor(e.target.value)} className="w-8 h-8 rounded border border-[var(--oracle-border)] bg-transparent cursor-pointer" />
                <span className="font-mono">{s.teamColor}</span>
              </label>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--oracle-text-secondary)]">
                Where does the room name appear on your screen? This is what ORACLE reads.
              </p>
              <div className="space-y-2">
                {COMPASS_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => s.setCompassPreset(p.label)}
                    className={`w-full py-3 px-4 rounded-lg border text-left transition-all cursor-pointer hover:bg-white/5 ${
                      s.compassPreset === p.label ? "border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/10" : "border-[var(--oracle-border)]"
                    }`}
                  >
                    <span className="block text-sm font-medium text-[var(--oracle-text-primary)]">{p.label}</span>
                    <span className="block font-mono text-[10px] text-[var(--oracle-text-muted)] mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
              {/* Mini screen preview */}
              <div className="relative h-28 rounded-lg bg-black/60 border border-[var(--oracle-border)] overflow-hidden" aria-hidden>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-white/60 tracking-widest">2F CONSTRUCTION</span>
                <div
                  className="absolute left-[30%] bottom-1 w-[40%] h-5 border border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/15"
                  style={{ top: s.compassPreset === "Top Center" ? "8%" : undefined }}
                />
              </div>
              <p className="text-xs text-[var(--oracle-text-muted)]">Fine-tune anytime in Settings → Calibrate.</p>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--oracle-text-secondary)]">Where should callouts appear while you play?</p>
              <div className="grid grid-cols-3 gap-2">
                {ANCHORS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => pickAnchor(a.id)}
                    className={`py-2.5 px-2 rounded-lg border font-mono text-[10px] tracking-wider transition-all cursor-pointer hover:bg-white/5 ${
                      s.overlayAnchor === a.id ? "border-[var(--oracle-accent)] text-[var(--oracle-accent)] bg-[var(--oracle-accent)]/10" : "border-[var(--oracle-border)] text-[var(--oracle-text-secondary)]"
                    }`}
                  >
                    {a.label.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1"><Slider label="Opacity" value={s.overlayOpacity} min={0.1} max={1} step={0.05} onChange={(v) => { s.setOverlayOpacity(v); void window.oracle?.invoke("overlay:config", { opacity: v }); }} /></div>
                <div className="flex-1"><Slider label="Scale" value={s.overlayScale} min={0.5} max={2} step={0.1} onChange={(v) => { s.setOverlayScale(v); void window.oracle?.invoke("overlay:config", { scale: v }); }} /></div>
              </div>
            </div>
          )}

          {stepIndex === 4 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 mx-auto rounded-full border-2 border-[var(--oracle-accent)] flex items-center justify-center">
                <Check size={26} className="text-[var(--oracle-accent)]" />
              </div>
              <p className="text-sm text-[var(--oracle-text-secondary)]">
                Setup complete. Hit <span className="font-mono text-[var(--oracle-accent)]">Start OCR</span> when you're in a match,
                and press <kbd className="font-mono px-1.5 py-0.5 rounded bg-white/5 border border-[var(--oracle-border-strong)] text-xs">Ctrl+Shift+Q</kbd> to toggle the overlay in game.
              </p>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={back}
              disabled={stepIndex === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-[var(--oracle-text-secondary)] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-6 py-2 rounded-lg text-sm font-semibold bg-[var(--oracle-accent)] text-[#0a0a0f] hover:bg-[var(--oracle-accent-strong)] transition-colors cursor-pointer"
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
            >
              {stepIndex === STEPS.length - 1 ? "Launch ORACLE" : "Continue"} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-[var(--oracle-text-muted)]">{label}</label>
        <span className="font-mono text-[10px] text-[var(--oracle-text-muted)]">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-[var(--oracle-accent)]"
      />
    </div>
  );
}
