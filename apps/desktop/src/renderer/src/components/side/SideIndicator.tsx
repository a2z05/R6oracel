import { Sword, Castle, Shield, Crosshair, Swords, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export type Side = "attack" | "defense" | "unknown";
export type IconSetId = "auto" | "sword-castle" | "crosshair-shield" | "swords-shield";

/**
 * Icon sets for side display. The player picks which set they like;
 * "auto" keeps the default sword/castle pairing.
 */
export const ICON_SETS: Record<IconSetId, { label: string; attack: LucideIcon; defense: LucideIcon }> = {
  auto: { label: "Auto (match detected)", attack: Sword, defense: Castle },
  "sword-castle": { label: "Sword / Castle", attack: Sword, defense: Castle },
  "crosshair-shield": { label: "Crosshair / Shield", attack: Crosshair, defense: Shield },
  "swords-shield": { label: "Swords / Shield", attack: Swords, defense: Shield },
};

// ── Player-made icons cropped from their own screenshots ──
// Shared across all SideIndicator instances; invalidated when
// the player changes an icon in settings.
type CustomIcons = { attack: string | null; defense: string | null };

let customCache: CustomIcons | null = null;
const listeners = new Set<(c: CustomIcons) => void>();

async function loadCustom(force = false): Promise<CustomIcons> {
  if (!customCache || force) {
    const paths = (await window.oracle?.invoke("icons:get-custom")) as Record<string, string> | undefined;
    customCache = { attack: paths?.attack ?? null, defense: paths?.defense ?? null };
  }
  return customCache;
}

/** Call after saving/clearing a custom icon so every indicator refreshes. */
export function invalidateCustomSideIcons(): void {
  customCache = null;
  void loadCustom(true).then((c) => listeners.forEach((l) => l(c)));
}

function useCustomIcons(): CustomIcons {
  const [custom, setCustom] = useState<CustomIcons>(customCache ?? { attack: null, defense: null });
  useEffect(() => {
    let alive = true;
    void loadCustom().then((c) => {
      if (alive) setCustom(c);
    });
    const listener = (c: CustomIcons) => setCustom(c);
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);
  return custom;
}

export function SideIndicator({
  side,
  iconSet = "auto",
  compact = false,
}: {
  side: Side;
  iconSet?: IconSetId;
  compact?: boolean;
}) {
  const set = ICON_SETS[iconSet] ?? ICON_SETS.auto;
  const custom = useCustomIcons();

  // Unknown side — neutral placeholder
  if (side === "unknown") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--oracle-text-muted)]">
        <Eye size={compact ? 12 : 14} />
        {!compact && <span className="text-xs">Detecting…</span>}
      </span>
    );
  }

  const isAttack = side === "attack";
  const customImg = isAttack ? custom.attack : custom.defense;
  const Icon = isAttack ? set.attack : set.defense;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase ${
        isAttack ? "text-[var(--oracle-danger)]" : "text-[var(--oracle-info)]"
      }`}
      title={isAttack ? "Attacking side" : "Defending side"}
      aria-label={isAttack ? "Attacking side" : "Defending side"}
    >
      {/* Player's team always shown on the left; custom image wins over built-in icon */}
      {customImg ? (
        <img src={customImg} alt="" width={compact ? 13 : 15} height={compact ? 13 : 15} className="object-contain" />
      ) : (
        <Icon size={compact ? 13 : 15} />
      )}
      {!compact && <span>{isAttack ? "ATK" : "DEF"}</span>}
    </span>
  );
}
