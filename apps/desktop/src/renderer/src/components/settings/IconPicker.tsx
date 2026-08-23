import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Trash2 } from "lucide-react";

type Slot = "attack" | "defense";
export type CustomSideIcons = Record<Slot, string | null>;

/**
 * Lets the player use their own in-game imagery as side icons:
 * pick a screenshot, then drag a rectangle over the part they want
 * (e.g. the ATK/DEF badge in the game HUD). The crop becomes the icon.
 */
export function CustomIconPicker({ onCustomChange }: { onCustomChange?: (custom: CustomSideIcons) => void }) {
  const [customIcons, setCustomIcons] = useState<CustomSideIcons>({ attack: null, defense: null });
  const [selecting, setSelecting] = useState<Slot | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selStart, setSelStart] = useState<{ x: number; y: number } | null>(null);
  const [selRect, setSelRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const loadCustom = useCallback(async () => {
    const paths = (await window.oracle?.invoke("icons:get-custom")) as Record<Slot, string>;
    const next = { attack: paths.attack ?? null, defense: paths.defense ?? null };
    setCustomIcons(next);
    onCustomChange?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing custom icons once
  useEffect(() => {
    void loadCustom();
  }, [loadCustom]);

  const beginSelect = async (slot: Slot) => {
    setSelecting(slot);
    setSelRect(null);
    setSelStart(null);
    const result = (await window.oracle?.invoke("icons:open-image")) as {
      ok: boolean;
      path?: string;
      dataUrl?: string;
      error?: string;
    };
    if (!result.ok || !result.path || !result.dataUrl) {
      if (result.error) console.error("Icon pick failed:", result.error);
      setSelecting(null);
      return;
    }
    setImagePath(result.path);
    setPreviewUrl(result.dataUrl);
  };

  const pointFromEvent = useCallback((e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const finishCrop = async () => {
    if (!selRect || !selecting || !imagePath) return;
    // Ignore accidental clicks with no real area
    if (selRect.width < 0.01 || selRect.height < 0.01) {
      setSelRect(null);
      setSelStart(null);
      return;
    }
    setBusy(true);
    try {
      await window.oracle?.invoke("icons:crop-from-path", {
        slot: selecting,
        imagePath,
        crop: selRect,
      });
      await loadCustom();
    } finally {
      setBusy(false);
      setSelecting(null);
      setSelRect(null);
      setSelStart(null);
      setPreviewUrl(null);
      setImagePath(null);
    }
  };

  const clearSlot = async (slot: Slot) => {
    await window.oracle?.invoke("icons:clear", { slot });
    await loadCustom();
  };

  const cancel = () => {
    setSelecting(null);
    setImagePath(null);
    setPreviewUrl(null);
    setSelRect(null);
    setSelStart(null);
  };

  // ── Region-selection view ──
  if (selecting && previewUrl && imagePath) {
    return (
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--oracle-text-primary)]">
            Select the {selecting === "attack" ? "Attack" : "Defend"} icon area
          </h4>
          <button aria-label="Cancel icon selection" onClick={cancel} className="p-1 rounded hover:bg-white/10 cursor-pointer">
            <X size={14} className="text-[var(--oracle-text-secondary)]" />
          </button>
        </div>
        <p className="text-xs text-[var(--oracle-text-muted)]">Drag a rectangle over the icon you want to use.</p>

        <div
          className="relative max-h-64 overflow-hidden rounded-lg border border-[var(--oracle-border)] select-none cursor-crosshair"
          onMouseDown={(e) => {
            e.preventDefault();
            setSelStart(pointFromEvent(e));
            setSelRect(null);
          }}
          onMouseMove={(e) => {
            if (!selStart) return;
            const p = pointFromEvent(e);
            setSelRect({
              x: Math.min(selStart.x, p.x),
              y: Math.min(selStart.y, p.y),
              width: Math.abs(p.x - selStart.x),
              height: Math.abs(p.y - selStart.y),
            });
          }}
          onMouseUp={() => void finishCrop()}
        >
          <img ref={imgRef} src={previewUrl} alt="Selected screenshot" className="w-full pointer-events-none" draggable={false} />
          {selRect && (
            <div
              className="absolute border-2 border-[var(--oracle-accent)] bg-[var(--oracle-accent)]/20 pointer-events-none"
              style={{
                left: `${selRect.x * 100}%`,
                top: `${selRect.y * 100}%`,
                width: `${selRect.width * 100}%`,
                height: `${selRect.height * 100}%`,
              }}
            />
          )}
        </div>

        {busy && <p className="text-xs text-[var(--oracle-accent)] animate-pulse">Saving icon…</p>}
      </div>
    );
  }

  // ── Idle view: current icons + pick buttons ──
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {(["attack", "defense"] as const).map((slot) => (
          <div key={slot} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-lg border border-[var(--oracle-border)] overflow-hidden flex items-center justify-center bg-black/30">
              {customIcons[slot] ? (
                <img src={customIcons[slot]!} alt={`Custom ${slot} icon`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-[var(--oracle-text-muted)] uppercase">{slot}</span>
              )}
            </div>
            {customIcons[slot] ? (
              <button
                onClick={() => void clearSlot(slot)}
                className="flex items-center gap-1 text-[10px] text-[var(--oracle-danger)] hover:underline cursor-pointer"
                aria-label={`Clear custom ${slot} icon`}
              >
                <Trash2 size={10} /> Clear
              </button>
            ) : (
              <span className="text-[10px] text-[var(--oracle-text-muted)] capitalize">{slot}</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => void beginSelect(customIcons.attack ? "defense" : "attack")}
        className="flex items-center gap-2 py-2 px-3 rounded-lg border border-[var(--oracle-border)] text-xs text-[var(--oracle-text-secondary)] hover:bg-white/5 cursor-pointer transition-colors"
      >
        <Upload size={13} />
        Pick from screenshot{customIcons.attack && customIcons.defense ? "" : ` (${customIcons.attack ? "next: defend" : "next: attack"})`}
      </button>
    </div>
  );
}
