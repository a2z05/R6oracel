/**
 * ConnectionStatus - Visual indicator for WebSocket connection state.
 * Shows colored dot + label with latency info.
 */

import type { ConnectionStatus as Status } from "../hooks/useWebSocket";

interface ConnectionStatusProps {
  status: Status;
  latency: number | null;
  onReconnect?: () => void;
}

const STATUS_CONFIG: Record<
  Status,
  { color: string; glowClass: string; label: string; dotClass: string }
> = {
  connected: {
    color: "bg-oracle-green",
    glowClass: "glow-green status-connected",
    label: "Connected",
    dotClass: "",
  },
  connecting: {
    color: "bg-oracle-amber",
    glowClass: "",
    label: "Connecting...",
    dotClass: "animate-pulse-gold",
  },
  reconnecting: {
    color: "bg-oracle-amber",
    glowClass: "",
    label: "Reconnecting...",
    dotClass: "animate-pulse-gold",
  },
  disconnected: {
    color: "bg-oracle-red",
    glowClass: "glow-red",
    label: "Disconnected",
    dotClass: "",
  },
};

export function ConnectionStatus({
  status,
  latency,
  onReconnect,
}: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <button
      onClick={onReconnect}
      className={`
        flex items-center gap-2 px-3 py-1.5
        glass rounded-full
        transition-all duration-200
        active:scale-95
        ${status === "disconnected" ? "cursor-pointer" : "cursor-default"}
      `}
      disabled={status === "connecting" || status === "reconnecting"}
    >
      {/* Status dot */}
      <span
        className={`
          block w-2 h-2 rounded-full
          ${config.color}
          ${config.glowClass}
          ${config.dotClass}
        `}
      />

      {/* Label */}
      <span className="text-xs font-medium text-text-secondary">
        {config.label}
      </span>

      {/* Latency (only when connected) */}
      {status === "connected" && latency !== null && (
        <span className="text-xs text-text-muted font-mono">
          {latency}ms
        </span>
      )}
    </button>
  );
}
