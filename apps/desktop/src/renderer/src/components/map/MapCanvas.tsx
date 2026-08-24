import { useRef, useState, useCallback, useEffect } from "react";
import { useMapStore } from "../../stores/map-store.js";
import { PlayerMarker } from "./PlayerMarker.js";

interface MapRoom {
  id: string; floor: number; name: string; displayName: string;
  x: number; y: number; width: number; height: number;
}

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // r6calls embedded floor-plan blueprint for the current map+floor
  const [floorImg, setFloorImg] = useState<string | null>(null);

  const selectedMapId = useMapStore((s) => s.selectedMapId);
  const rooms = useMapStore((s) => s.rooms);
  const connections = useMapStore((s) => s.connections);
  const currentFloor = useMapStore((s) => s.currentFloor);
  const highlightedRoomId = useMapStore((s) => s.highlightedRoomId);
  const zoom = useMapStore((s) => s.zoom);
  const pan = useMapStore((s) => s.pan);
  const setPan = useMapStore((s) => s.setPan);
  const setZoom = useMapStore((s) => s.setZoom);
  const highlightRoom = useMapStore((s) => s.highlightRoom);

  const floorRooms = rooms.filter((r) => r.floor === currentFloor);

  // Fetch the real floor plan (r6calls.com imagery, credited in-app)
  useEffect(() => {
    if (!selectedMapId) return;
    let cancelled = false;
    window.oracle
      ?.getFloorImage(selectedMapId, currentFloor)
      .then((res) => {
        if (!cancelled) setFloorImg(res?.ok ? (res.dataUrl ?? null) : null);
      })
      .catch(() => {
        if (!cancelled) setFloorImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMapId, currentFloor]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0]!.contentRect;
      setDims({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1));
  }, [zoom, setZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart, setPan]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const roomCenter = (r: MapRoom) => ({ cx: (r.x + r.width / 2) * dims.w, cy: (r.y + r.height / 2) * dims.h });

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width={dims.w}
        height={dims.h}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Real floor plan — r6calls.com blueprint imagery */}
        {floorImg && (
          <image
            href={floorImg}
            x={0}
            y={0}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            opacity={0.92}
          />
        )}

        {/* Connection lines */}
        {connections.map((conn, i) => {
          const fromRoom = floorRooms.find((r) => r.id === conn.fromRoomId);
          const toRoom = floorRooms.find((r) => r.id === conn.toRoomId);
          if (!fromRoom || !toRoom) return null;
          const a = roomCenter(fromRoom);
          const b = roomCenter(toRoom);
          return (
            <line
              key={i}
              x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
              stroke="var(--oracle-text-muted)"
              strokeWidth="1.5"
              strokeDasharray={conn.type === "hatch" ? "4,4" : conn.type === "rotation" ? "none" : "8,4"}
              opacity={0.4}
            />
          );
        })}

        {/* Room polygons */}
        {floorRooms.map((room) => {
          const isHighlighted = room.id === highlightedRoomId;
          const px = room.x * dims.w;
          const py = room.y * dims.h;
          const pw = room.width * dims.w;
          const ph = room.height * dims.h;

          return (
            <g key={room.id} onClick={() => highlightRoom(room.id)} className="cursor-pointer">
              <rect
                x={px} y={py} width={pw} height={ph}
                rx="6" ry="6"
                fill={isHighlighted ? "var(--oracle-accent-dim)" : "rgba(255,255,255,0.03)"}
                stroke={isHighlighted ? "var(--oracle-accent)" : "var(--oracle-border)"}
                strokeWidth={isHighlighted ? 2 : 1}
                filter={isHighlighted ? "url(#glow)" : undefined}
                className="transition-all duration-200"
              />
              <text
                x={px + pw / 2} y={py + ph / 2}
                textAnchor="middle" dominantBaseline="central"
                fill={isHighlighted ? "var(--oracle-accent)" : "var(--oracle-text-secondary)"}
                fontSize={Math.min(11, pw / 8)}
                fontFamily="var(--oracle-font)"
                fontWeight={isHighlighted ? 600 : 400}
              >
                {room.displayName}
              </text>
            </g>
          );
        })}

        {/* Player marker */}
        {highlightedRoomId && (() => {
          const room = floorRooms.find((r) => r.id === highlightedRoomId);
          if (!room) return null;
          const c = roomCenter(room);
          return <PlayerMarker x={c.cx} y={c.cy} />;
        })()}
      </svg>
    </div>
  );
}
