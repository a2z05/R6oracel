/**
 * MobileRoomInfo - Compact room information display for mobile.
 * Shows current map, room name, floor, and OCR confidence.
 */

import type { RoomInfo } from "../hooks/useRoomData";

const FLOOR_LABELS: Record<number, string> = {
  "-1": "B1",
  "0": "G",
  "1": "1F",
  "2": "2F",
  "3": "3F",
};

interface MobileRoomInfoProps {
  mapId: string | null;
  room: RoomInfo | null;
  floor: number;
  confidence: number;
  ocrText: string | null;
  isActive: boolean;
}

export function MobileRoomInfo({
  mapId,
  room,
  floor,
  confidence,
  ocrText,
  isActive,
}: MobileRoomInfoProps) {
  const floorLabel = FLOOR_LABELS[floor] ?? `F${floor}`;

  const formatMapName = (id: string): string => {
    return id
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Map + Floor header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Map icon */}
          <svg
            className="w-4 h-4 text-oracle-gold"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-sm font-semibold text-text-primary">
            {mapId ? formatMapName(mapId) : "No Map"}
          </span>
        </div>

        {/* Floor badge */}
        <span className="px-2 py-0.5 rounded-md bg-oracle-gold/10 text-oracle-gold text-xs font-bold font-mono">
          {floorLabel}
        </span>
      </div>

      {/* Room name */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-text-primary leading-tight">
            {room?.displayName ?? "Unknown Room"}
          </p>
          {room && (
            <p className="text-xs text-text-muted mt-0.5 font-mono">
              {room.roomId}
            </p>
          )}
        </div>
      </div>

      {/* OCR Status bar */}
      <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
        {/* OCR active indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`
              block w-1.5 h-1.5 rounded-full
              ${isActive ? "bg-oracle-green animate-pulse-gold" : "bg-text-muted"}
            `}
          />
          <span className="text-xs text-text-secondary">
            {isActive ? "OCR Active" : "OCR Idle"}
          </span>
        </div>

        {/* Confidence bar */}
        {confidence > 0 && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className={`
                  h-full rounded-full transition-all duration-500
                  ${confidence > 80 ? "bg-oracle-green" : confidence > 50 ? "bg-oracle-amber" : "bg-oracle-red"}
                `}
                style={{ width: `${Math.min(confidence, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted min-w-[2.5rem] text-right">
              {Math.round(confidence)}%
            </span>
          </div>
        )}
      </div>

      {/* Raw OCR text (when available) */}
      {ocrText && (
        <div className="pt-2 border-t border-border-subtle">
          <p className="text-xs text-text-muted font-mono truncate">{ocrText}</p>
        </div>
      )}
    </div>
  );
}
