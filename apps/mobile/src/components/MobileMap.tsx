/**
 * MobileMap - Touch-optimized map view with room dots and floor selector.
 * Renders rooms as interactive dots on a dark map background.
 */

import { useCallback, useRef, useState } from "react";
import type { RoomInfo } from "../hooks/useRoomData";

interface MobileMapProps {
  rooms: RoomInfo[];
  activeRoomId: string | null;
  floor: number;
  onRoomTap?: (roomId: string) => void;
}

const FLOOR_OPTIONS = [
  { level: -1, label: "B1" },
  { level: 0, label: "G" },
  { level: 1, label: "1F" },
  { level: 2, label: "2F" },
];

export function MobileMap({
  rooms,
  activeRoomId,
  floor,
  onRoomTap,
}: MobileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Pinch-to-zoom state
  const lastTouchDistance = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance.current > 0) {
          const ratio = distance / lastTouchDistance.current;
          setScale((prev) => Math.min(Math.max(prev * ratio, 0.5), 3));
        }
        lastTouchDistance.current = distance;
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = 0;
  }, []);

  const handleRoomTap = useCallback(
    (roomId: string) => {
      onRoomTap?.(roomId);
    },
    [onRoomTap]
  );

  // Filter rooms to current floor
  const floorRooms = rooms.filter((r) => r.floor === floor);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Floor selector */}
      <div className="flex items-center justify-center gap-1 p-2 border-b border-border-subtle">
        {FLOOR_OPTIONS.map((f) => (
          <button
            key={f.level}
            className={`
              px-3 py-1 rounded-lg text-xs font-bold font-mono
              transition-all duration-200
              ${
                floor === f.level
                  ? "bg-oracle-gold/20 text-oracle-gold"
                  : "text-text-muted hover:text-text-secondary"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map area */}
      <div
        ref={containerRef}
        className="map-container relative w-full aspect-[4/3] bg-surface-base"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid lines for visual reference */}
        <svg
          className="absolute inset-0 w-full h-full opacity-5"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Vertical grid */}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 10}
              y1={0}
              x2={i * 10}
              y2={100}
              stroke="white"
              strokeWidth="0.2"
            />
          ))}
          {/* Horizontal grid */}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 10}
              x2={100}
              y2={i * 10}
              stroke="white"
              strokeWidth="0.2"
            />
          ))}
        </svg>

        {/* Room dots */}
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        >
          {floorRooms.map((room) => {
            const isActive = room.roomId === activeRoomId;
            const isHovered = room.roomId === hoveredRoom;

            return (
              <button
                key={room.roomId}
                className={`
                  absolute transform -translate-x-1/2 -translate-y-1/2
                  transition-all duration-200
                  ${isActive ? "z-20" : "z-10"}
                `}
                style={{
                  left: `${room.x * 100}%`,
                  top: `${room.y * 100}%`,
                }}
                onClick={() => handleRoomTap(room.roomId)}
                onTouchStart={() => setHoveredRoom(room.roomId)}
                onTouchEnd={() => setHoveredRoom(null)}
              >
                {/* Pulse ring for active room */}
                {isActive && (
                  <span
                    className="
                      absolute inset-0 -m-2
                      rounded-full border border-oracle-gold/40
                      animate-ping
                    "
                    style={{ animationDuration: "2s" }}
                  />
                )}

                {/* Room dot */}
                <span
                  className={`
                    block rounded-full
                    transition-all duration-200
                    ${
                      isActive
                        ? "w-4 h-4 bg-oracle-gold glow-gold-strong"
                        : isHovered
                          ? "w-3.5 h-3.5 bg-oracle-gold/70"
                          : "w-2.5 h-2.5 bg-oracle-gold/40 hover:bg-oracle-gold/60"
                    }
                  `}
                />

                {/* Room label (show on hover/active) */}
                {(isActive || isHovered) && (
                  <span
                    className="
                      absolute top-full left-1/2 -translate-x-1/2 mt-1
                      px-1.5 py-0.5 rounded
                      glass text-[10px] font-medium text-text-primary
                      whitespace-nowrap
                      animate-fade-in
                    "
                  >
                    {room.displayName}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {floorRooms.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-text-muted">No rooms on this floor</p>
          </div>
        )}

        {/* Zoom indicator */}
        {scale !== 1 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 glass rounded text-xs font-mono text-text-muted">
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
