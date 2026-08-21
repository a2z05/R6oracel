import { useState } from "react";
import { Shield, Swords, Crosshair, Flower2, RotateCcw, AlertTriangle } from "lucide-react";
import { CardContainer } from "./CardContainer.js";
import { useMapStore } from "../../stores/map-store.js";

interface TacticalCard {
  id: string;
  title: string;
  phase: string;
  icon: React.ReactNode;
  color: string;
  body: string;
}

// Default tactical card templates
const DEFAULT_CARDS: TacticalCard[] = [
  { id: "defense-prep", title: "Defense Prep", phase: "defense_prep", icon: <Shield size={14} />, color: "var(--oracle-info)", body: "Reinforce hatches and walls. Set up anchor positions. Place utility near site entrances." },
  { id: "attack-entry", title: "Attack Entry", phase: "attack", icon: <Swords size={14} />, color: "var(--oracle-danger)", body: "Drone first entry points. Clear common anchor spots. Watch for runouts and flanks." },
  { id: "spawn-peek", title: "Spawn Peek", phase: "round1_defense", icon: <Crosshair size={14} />, color: "var(--oracle-warning)", body: "Check common spawn peek windows at round start. Risk vs reward assessment." },
  { id: "post-plant", title: "Post Plant", phase: "post_plant", icon: <Flower2 size={14} />, color: "var(--oracle-success)", body: "Default plant spots. Post-plant positions. Watch for defuser denial." },
  { id: "rotate", title: "Rotation Routes", phase: "defense_prep", icon: <RotateCcw size={14} />, color: "var(--oracle-accent)", body: "Create rotation holes between bomb sites. Ensure safe movement paths." },
  { id: "retake", title: "Retake Warning", phase: "post_plant", icon: <AlertTriangle size={14} />, color: "var(--oracle-danger)", body: "Coordinated retake timing. Utility usage for site re-entry." },
];

export function TacticalCards() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const highlightedRoomId = useMapStore((s) => s.highlightedRoomId);

  const visibleCards = DEFAULT_CARDS.filter((c) => !dismissed.has(c.id));

  if (visibleCards.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-[var(--oracle-text-muted)]">All cards dismissed</p>
        <button
          onClick={() => setDismissed(new Set())}
          className="mt-2 text-xs text-[var(--oracle-accent)] hover:underline"
        >
          Reset cards
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-4 mb-2">
        <h3 className="text-xs font-semibold text-[var(--oracle-text-muted)] uppercase tracking-wider">
          Tactical Intel
        </h3>
      </div>
      {visibleCards.map((card) => (
        <CardContainer
          key={card.id}
          title={card.title}
          icon={card.icon}
          accentColor={card.color}
          onDismiss={() => setDismissed((prev) => new Set(prev).add(card.id))}
        >
          <p>{card.body}</p>
          {highlightedRoomId && (
            <p className="mt-2 text-xs text-[var(--oracle-text-muted)] italic">
              Tips specific to current room coming soon...
            </p>
          )}
        </CardContainer>
      ))}
    </div>
  );
}
