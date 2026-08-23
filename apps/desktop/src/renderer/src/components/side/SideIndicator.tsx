import { Sword, Castle, Shield, Crosshair, Swords, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  const Icon = isAttack ? set.attack : set.defense;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase ${
        isAttack ? "text-[var(--oracle-danger)]" : "text-[var(--oracle-info)]"
      }`}
      title={isAttack ? "Attacking side" : "Defending side"}
      aria-label={isAttack ? "Attacking side" : "Defending side"}
    >
      {/* Player's team always shown on the left */}
      <Icon size={compact ? 13 : 15} />
      {!compact && <span>{isAttack ? "ATK" : "DEF"}</span>}
    </span>
  );
}
