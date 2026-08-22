import { useState, useCallback, useRef, useEffect } from "react";
import { X, Keyboard, Monitor, Eye, Palette, ToggleLeft, Database, Crosshair, Move } from "lucide-react";
import { useUIStore } from "../../stores/ui-store.js";
import { useSettingsStore } from "../../stores/settings-store.js";
import { themes, type ThemeId } from "@oracle/ui-tokens";

type SettingsTab = "hotkeys" | "overlay" | "ocr" | "calibrate" | "theme" | "modules" | "data";

const TABS: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: "calibrate", label: "Calibrate", icon: <Crosshair size={14} /> },
  { id: "hotkeys", label: "Hotkeys", icon: <Keyboard size={14} /> },
  { id: "overlay", label: "Overlay", icon: <Monitor size={14} /> },
  { id: "ocr", label: "OCR", icon: <Eye size={14} /> },
  { id: "theme", label: "Theme", icon: <Palette size={14} /> },
  { id: "modules", label: "Modules", icon: <ToggleLeft size={14} /> },
  { id: "data", label: "Data", icon: <Database size={14} /> },
];

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("theme");
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const settings = useSettingsStore();

  return (
    <div className="h-full flex flex-col bg-[var(--oracle-bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--oracle-border)]">
        <h1 className="text-lg font-bold text-[var(--oracle-text-primary)]">Settings</h1>
        <button onClick={toggleSettings} className="p-1.5 rounded hover:bg-white/5 transition-colors">
          <X size={16} className="text-[var(--oracle-text-secondary)]" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tab list */}
        <div className="w-48 border-r border-[var(--oracle-border)] py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--oracle-accent)]/10 text-[var(--oracle-accent)] border-r-2 border-[var(--oracle-accent)]"
                  : "text-[var(--oracle-text-secondary)] hover:bg-white/5 hover:text-[var(--oracle-text-primary)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "calibrate" && <CalibrateTab />}
          {activeTab === "theme" && <ThemeTab />}
          {activeTab === "hotkeys" && <HotkeysTab />}
          {activeTab === "overlay" && <OverlayTab />}
          {activeTab === "ocr" && <OcrTab />}
          {activeTab === "modules" && <ModulesTab />}
          {activeTab === "data" && <DataTab />}
        </div>
      </div>
    </div>
  );
}

function ThemeTab() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const setAccentColor = useSettingsStore((s) => s.setAccentColor);

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-4">Theme</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.entries(themes) as [ThemeId, typeof themes[ThemeId]][]).map(([id, t]) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              theme === id
                ? "border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/5"
                : "border-[var(--oracle-border)] hover:border-[var(--oracle-border-strong)]"
            }`}
          >
            <div className="flex gap-1.5 mb-2">
              {Object.values(t.colors).slice(0, 5).map((c, i) => (
                <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-sm font-medium text-[var(--oracle-text-primary)]">{t.label}</span>
          </button>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-2">Accent Color</h3>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={accentColor}
          onChange={(e) => setAccentColor(e.target.value)}
          className="w-10 h-10 rounded-lg border border-[var(--oracle-border)] cursor-pointer"
        />
        <span className="text-sm text-[var(--oracle-text-secondary)]">{accentColor}</span>
      </div>
    </div>
  );
}

function HotkeysTab() {
  const hotkeys = [
    { action: "Toggle Overlay", key: "Ctrl+Shift+Q" },
    { action: "Pause OCR", key: "Ctrl+Shift+P" },
    { action: "Screenshot", key: "Ctrl+Shift+S" },
    { action: "Refresh QR", key: "Ctrl+Shift+R" },
    { action: "Toggle Cards", key: "Ctrl+Shift+C" },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-4">Hotkeys</h2>
      <div className="space-y-2">
        {hotkeys.map((h) => (
          <div key={h.action} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--oracle-bg-surface)] border border-[var(--oracle-border)]">
            <span className="text-sm text-[var(--oracle-text-secondary)]">{h.action}</span>
            <kbd className="px-2 py-1 rounded bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-xs text-[var(--oracle-accent)] font-mono">
              {h.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverlayTab() {
  const s = useSettingsStore();
  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-4">Overlay</h2>
      <div className="space-y-4">
        <Slider label="Opacity" value={s.overlayOpacity} min={0.1} max={1} step={0.05} onChange={s.setOverlayOpacity} />
        <Slider label="Scale" value={s.overlayScale} min={0.5} max={2} step={0.1} onChange={s.setOverlayScale} />
        <Slider label="Blur" value={s.overlayBlur} min={0} max={30} step={1} onChange={s.setOverlayBlur} />
      </div>
    </div>
  );
}

function OcrTab() {
  const s = useSettingsStore();
  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-4">OCR Settings</h2>
      <div className="space-y-4">
        <Slider label="Interval (ms)" value={s.ocrInterval} min={100} max={1000} step={50} onChange={s.setOcrInterval} />
        <Slider label="Sensitivity" value={s.ocrSensitivity} min={0} max={100} step={5} onChange={s.setOcrSensitivity} />
        <label className="flex items-center gap-2 text-sm text-[var(--oracle-text-secondary)]">
          <input
            type="checkbox"
            checked={s.debugMode}
            onChange={(e) => s.setDebugMode(e.target.checked)}
            className="rounded border-[var(--oracle-border-strong)]"
          />
          Debug mode
        </label>
      </div>
    </div>
  );
}

function ModulesTab() {
  const modules = useSettingsStore((s) => s.modules);
  const toggleModule = useSettingsStore((s) => s.toggleModule);
  const moduleList = Object.entries(modules);

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-4">Modules</h2>
      <div className="space-y-2">
        {moduleList.map(([key, enabled]) => (
          <label key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--oracle-bg-surface)] border border-[var(--oracle-border)] cursor-pointer">
            <span className="text-sm text-[var(--oracle-text-secondary)] capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
            <div
              onClick={() => toggleModule(key)}
              className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${enabled ? "bg-[var(--oracle-accent)]" : "bg-[var(--oracle-text-muted)]"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5 ${enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function DataTab() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)] mb-4">Data Management</h2>
      <div className="space-y-3">
        <button className="w-full py-2 px-4 rounded-lg bg-[var(--oracle-accent)]/10 border border-[var(--oracle-accent)]/30 text-sm text-[var(--oracle-accent)] hover:bg-[var(--oracle-accent)]/20 transition-colors">
          Import Data
        </button>
        <button className="w-full py-2 px-4 rounded-lg bg-[var(--oracle-bg-surface)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-secondary)] hover:bg-white/5 transition-colors">
          Export Settings
        </button>
        <button className="w-full py-2 px-4 rounded-lg bg-[var(--oracle-danger)]/10 border border-[var(--oracle-danger)]/30 text-sm text-[var(--oracle-danger)] hover:bg-[var(--oracle-danger)]/20 transition-colors">
          Clear Cache
        </button>
      </div>
    </div>
  );
}

function CalibrateTab() {
  const s = useSettingsStore();
  const [captureRegion, setCaptureRegion] = useState({ x: 0, y: 85, width: 100, height: 10 });
  const [sideRegion, setSideRegion] = useState({ x: 0, y: 0, width: 100, height: 5 });
  const [isCapturing, setIsCapturing] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Compass is at bottom center of screen in R6 Siege
  // Based on screenshot: compass shows "2F Construction" at bottom
  const COMPASS_PRESETS = [
    { label: "Bottom Center (Default)", x: 35, y: 88, width: 30, height: 8 },
    { label: "Top Center", x: 35, y: 2, width: 30, height: 6 },
    { label: "Custom", x: captureRegion.x, y: captureRegion.y, width: captureRegion.width, height: captureRegion.height },
  ];

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const result = await window.oracle?.invoke("ocr:calibrate", {
        cropRegion: {
          x: captureRegion.x / 100,
          y: captureRegion.y / 100,
          width: captureRegion.width / 100,
          height: captureRegion.height / 100,
        },
      });
    } catch (err) {
      console.error("Calibration failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [captureRegion]);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-[var(--oracle-text-primary)]">Calibration</h2>
      <p className="text-xs text-[var(--oracle-text-muted)]">
        Configure where ORACLE looks on your screen. The compass position varies by resolution and settings.
      </p>

      {/* Team Color */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--oracle-text-primary)]">Team Color</h3>
        <p className="text-xs text-[var(--oracle-text-muted)]">
          Your team's accent color. ORACLE uses this to detect if you're attacking or defending.
          Match it to your in-game colorblind settings.
        </p>
        <div className="flex items-center gap-3">
          <label className="text-sm text-[var(--oracle-text-secondary)]">My team color:</label>
          <input
            type="color"
            value={s.teamColor}
            onChange={(e) => s.setTeamColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-[var(--oracle-border)] cursor-pointer"
          />
          <span className="text-xs text-[var(--oracle-text-muted)] font-mono">{s.teamColor}</span>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Blue (Default)", color: "#4488ff" },
            { label: "Orange", color: "#ff8c00" },
            { label: "Purple", color: "#9944ff" },
            { label: "Green", color: "#44cc44" },
            { label: "Yellow", color: "#ffcc00" },
            { label: "Red", color: "#ff4444" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => s.setTeamColor(preset.color)}
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                s.teamColor === preset.color
                  ? "border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/10"
                  : "border-[var(--oracle-border)] hover:bg-white/5"
              }`}
            >
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: preset.color }} />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compass Region */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--oracle-text-primary)]">Compass Region</h3>
        <p className="text-xs text-[var(--oracle-text-muted)]">
          Where the compass text appears on your screen. Adjust if ORACLE isn't reading the room name.
        </p>

        <div className="space-y-2">
          <label className="text-sm text-[var(--oracle-text-secondary)]">Preset:</label>
          <div className="flex gap-2">
            {COMPASS_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setCaptureRegion({ x: preset.x, y: preset.y, width: preset.width, height: preset.height })}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--oracle-border)] hover:bg-white/5 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">X Position (%)</label>
            <input
              type="number"
              value={captureRegion.x}
              onChange={(e) => setCaptureRegion({ ...captureRegion, x: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">Y Position (%)</label>
            <input
              type="number"
              value={captureRegion.y}
              onChange={(e) => setCaptureRegion({ ...captureRegion, y: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">Width (%)</label>
            <input
              type="number"
              value={captureRegion.width}
              onChange={(e) => setCaptureRegion({ ...captureRegion, width: parseInt(e.target.value) || 10 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">Height (%)</label>
            <input
              type="number"
              value={captureRegion.height}
              onChange={(e) => setCaptureRegion({ ...captureRegion, height: parseInt(e.target.value) || 5 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="relative w-full h-32 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--oracle-text-muted)]">
            Screen preview — compass region highlighted
          </div>
          <div
            className="absolute border-2 border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/10 rounded"
            style={{
              left: `${captureRegion.x}%`,
              top: `${captureRegion.y}%`,
              width: `${captureRegion.width}%`,
              height: `${captureRegion.height}%`,
            }}
          />
        </div>

        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="w-full py-2 px-4 rounded-lg bg-[var(--oracle-accent)]/10 border border-[var(--oracle-accent)]/30 text-sm text-[var(--oracle-accent)] hover:bg-[var(--oracle-accent)]/20 transition-colors disabled:opacity-50"
        >
          {isCapturing ? "Capturing..." : "Test Capture"}
        </button>
      </div>

      {/* Side Detection Region */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--oracle-text-primary)]">Side Detection Region</h3>
        <p className="text-xs text-[var(--oracle-text-muted)]">
          Where ORACLE looks to detect your team color. Default is the score area at the top.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">X Position (%)</label>
            <input
              type="number"
              value={sideRegion.x}
              onChange={(e) => setSideRegion({ ...sideRegion, x: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">Y Position (%)</label>
            <input
              type="number"
              value={sideRegion.y}
              onChange={(e) => setSideRegion({ ...sideRegion, y: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">Width (%)</label>
            <input
              type="number"
              value={sideRegion.width}
              onChange={(e) => setSideRegion({ ...sideRegion, width: parseInt(e.target.value) || 10 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--oracle-text-muted)]">Height (%)</label>
            <input
              type="number"
              value={sideRegion.height}
              onChange={(e) => setSideRegion({ ...sideRegion, height: parseInt(e.target.value) || 5 })}
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] text-sm text-[var(--oracle-text-primary)]"
            />
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
        <label className="text-sm text-[var(--oracle-text-secondary)]">{label}</label>
        <span className="text-xs text-[var(--oracle-text-muted)] font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full bg-[var(--oracle-bg-surface)] appearance-none cursor-pointer accent-[var(--oracle-accent)]"
      />
    </div>
  );
}
