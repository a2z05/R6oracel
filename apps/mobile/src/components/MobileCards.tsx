/**
 * MobileCards - Swipeable tactical strategy cards for mobile.
 * Displays operator tips, room connections, and tactical info
 * in horizontally scrollable card format.
 */

import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TacticalCard {
  id: string;
  title: string;
  module: string;
  body: string;
  phase: string;
  priority: number;
  color?: "gold" | "red" | "green" | "blue" | "cyan";
}

interface MobileCardsProps {
  cards: TacticalCard[];
  onCardTap?: (cardId: string) => void;
}

const MODULE_ICONS: Record<string, string> = {
  spawn_peek: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z",
  site_setup: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25Z",
  plant_tips: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  rotate_routes: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  room_images: "M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V4.5a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v15a1.5 1.5 0 0 0 1.5 1.5Z",
  neighbor_rooms: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
  operator_tips: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",
};

const CARD_COLORS: Record<string, string> = {
  gold: "border-oracle-gold/20 bg-oracle-gold/5",
  red: "border-oracle-red/20 bg-oracle-red/5",
  green: "border-oracle-green/20 bg-oracle-green/5",
  blue: "border-oracle-blue/20 bg-oracle-blue/5",
  cyan: "border-oracle-cyan/20 bg-oracle-cyan/5",
};

const MODULE_COLORS: Record<string, string> = {
  spawn_peek: "red",
  site_setup: "gold",
  plant_tips: "cyan",
  rotate_routes: "green",
  room_images: "blue",
  neighbor_rooms: "blue",
  operator_tips: "gold",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MobileCards({ cards, onCardTap }: MobileCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const progress = el.scrollLeft / (el.scrollWidth - el.clientWidth || 1);
    setScrollProgress(Math.min(Math.max(progress, 0), 1));
  }, []);

  const handleCardTap = useCallback(
    (cardId: string) => {
      if (expandedCard === cardId) {
        setExpandedCard(null);
      } else {
        setExpandedCard(cardId);
      }
      onCardTap?.(cardId);
    },
    [expandedCard, onCardTap]
  );

  if (cards.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <svg
          className="w-8 h-8 text-text-muted mx-auto mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <p className="text-sm text-text-muted">No tactical cards available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Tactical Cards
        </h3>
        <span className="text-xs text-text-muted font-mono">
          {cards.length} cards
        </span>
      </div>

      {/* Scrollable cards */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="card-scroll px-1"
          onScroll={handleScroll}
        >
          {cards.map((card) => {
            const isExpanded = expandedCard === card.id;
            const colorKey = card.color ?? MODULE_COLORS[card.module] ?? "gold";
            const colorClass = CARD_COLORS[colorKey] ?? CARD_COLORS.gold;
            const iconPath = MODULE_ICONS[card.module] ?? MODULE_ICONS.operator_tips;

            return (
              <button
                key={card.id}
                className={`
                  glass rounded-xl border p-3
                  w-[260px] min-h-[120px]
                  text-left
                  transition-all duration-200
                  active:scale-[0.98]
                  ${colorClass}
                  ${isExpanded ? "w-[300px] min-h-[180px]" : ""}
                `}
                onClick={() => handleCardTap(card.id)}
              >
                {/* Card header */}
                <div className="flex items-start gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-oracle-gold shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d={iconPath} />
                  </svg>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary leading-tight truncate">
                      {card.title}
                    </h4>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                      {card.phase.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                {/* Card body */}
                <p
                  className={`
                    text-xs text-text-secondary leading-relaxed
                    ${isExpanded ? "" : "line-clamp-3"}
                  `}
                >
                  {card.body}
                </p>

                {/* Priority indicator */}
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: Math.min(card.priority, 5) }, (_, i) => (
                    <span
                      key={i}
                      className="block w-1 h-1 rounded-full bg-oracle-gold/50"
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Scroll progress */}
        {cards.length > 1 && (
          <div className="flex justify-center mt-2">
            <div className="w-16 h-0.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-oracle-gold/40 rounded-full transition-all duration-100"
                style={{ width: `${Math.max(scrollProgress * 100, 15)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
