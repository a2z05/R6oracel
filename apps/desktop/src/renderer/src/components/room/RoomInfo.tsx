import { MapPin, Layers, Tag, ArrowRight } from "lucide-react";
import { useMapStore } from "../../stores/map-store.js";
import { useOcrStore } from "../../stores/ocr-store.js";

const FLOOR_LABELS: Record<number, string> = { "-1": "B1", 0: "G", 1: "1F", 2: "2F" };

export function RoomInfo() {
  const highlightedRoomId = useMapStore((s) => s.highlightedRoomId);
  const rooms = useMapStore((s) => s.rooms);
  const connections = useMapStore((s) => s.connections);
  const currentFloor = useMapStore((s) => s.currentFloor);
  const currentText = useOcrStore((s) => s.currentText);
  const confidence = useOcrStore((s) => s.confidence);

  const room = rooms.find((r) => r.id === highlightedRoomId);

  if (!room) {
    return (
      <div className="p-4 border-b border-[var(--oracle-border)]">
        <div className="text-center py-8">
          <MapPin size={24} className="mx-auto mb-2 text-[var(--oracle-text-muted)]" />
          <p className="text-sm text-[var(--oracle-text-muted)]">
            {currentText ? `Detected: "${currentText}"` : "No room selected"}
          </p>
          {currentText && (
            <p className="text-xs text-[var(--oracle-text-muted)] mt-1">
              Confidence: {Math.round(confidence)}%
            </p>
          )}
        </div>
      </div>
    );
  }

  // Find connected rooms
  const connectedIds = new Set<string>();
  for (const conn of connections) {
    if (conn.fromRoomId === room.id) connectedIds.add(conn.toRoomId);
    if (conn.toRoomId === room.id) connectedIds.add(conn.fromRoomId);
  }
  const connectedRooms = rooms.filter((r) => connectedIds.has(r.id));

  return (
    <div className="p-4 border-b border-[var(--oracle-border)]">
      {/* Room header */}
      <div className="mb-3">
        <h2 className="text-lg font-bold text-[var(--oracle-text-primary)]">{room.displayName}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-xs text-[var(--oracle-text-secondary)]">
            <Layers size={10} />
            {FLOOR_LABELS[room.floor] ?? room.floor}
          </span>
          <span className="text-[var(--oracle-text-muted)]">·</span>
          <span className="text-xs text-[var(--oracle-text-secondary)] capitalize">
            {room.mapId.replace(/-/g, " ")}
          </span>
        </div>
      </div>

      {/* Room image placeholder */}
      <div className="w-full h-24 rounded-lg bg-[var(--oracle-bg-primary)] border border-[var(--oracle-border)] flex items-center justify-center mb-3">
        <span className="text-xs text-[var(--oracle-text-muted)]">Room image</span>
      </div>

      {/* Neighbor rooms */}
      {connectedRooms.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--oracle-text-muted)] uppercase tracking-wider mb-2">
            Connected Rooms
          </h3>
          <div className="space-y-1">
            {connectedRooms.map((r) => (
              <button
                key={r.id}
                onClick={() => useMapStore.getState().highlightRoom(r.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-[var(--oracle-text-secondary)] hover:bg-white/5 hover:text-[var(--oracle-text-primary)] transition-colors text-left"
              >
                <ArrowRight size={10} className="text-[var(--oracle-accent)] shrink-0" />
                <span>{r.displayName}</span>
                <span className="ml-auto text-[10px] text-[var(--oracle-text-muted)]">
                  {FLOOR_LABELS[r.floor] ?? r.floor}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
