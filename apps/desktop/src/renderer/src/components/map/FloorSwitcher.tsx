import { useMapStore } from "../../stores/map-store.js";

const FLOORS = [
  { level: -1, label: "B1" },
  { level: 0, label: "G" },
  { level: 1, label: "1F" },
  { level: 2, label: "2F" },
];

export function FloorSwitcher() {
  const currentFloor = useMapStore((s) => s.currentFloor);
  const setFloor = useMapStore((s) => s.setFloor);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 glass-card p-1">
      {FLOORS.map((f) => (
        <button
          key={f.level}
          onClick={() => setFloor(f.level)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentFloor === f.level
              ? "bg-[var(--oracle-accent)] text-[var(--oracle-bg-primary)] shadow-lg"
              : "text-[var(--oracle-text-secondary)] hover:text-[var(--oracle-text-primary)] hover:bg-white/5"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
