interface PlayerMarkerProps {
  x: number;
  y: number;
}

export function PlayerMarker({ x, y }: PlayerMarkerProps) {
  return (
    <g>
      {/* Pulse ring */}
      <circle
        cx={x} cy={y} r="12"
        fill="none"
        stroke="var(--oracle-accent)"
        strokeWidth="1.5"
        opacity="0.6"
        style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
      >
        <animate attributeName="r" from="8" to="24" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.7" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Outer glow */}
      <circle
        cx={x} cy={y} r="16"
        fill="var(--oracle-accent)"
        opacity="0.08"
      />
      {/* Core dot */}
      <circle
        cx={x} cy={y} r="6"
        fill="var(--oracle-accent)"
        stroke="var(--oracle-bg-primary)"
        strokeWidth="2"
      />
      {/* Center */}
      <circle
        cx={x} cy={y} r="2.5"
        fill="var(--oracle-bg-primary)"
      />
    </g>
  );
}
