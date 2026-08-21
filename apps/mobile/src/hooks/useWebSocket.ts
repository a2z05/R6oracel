/**
 * WebSocket hook with auto-reconnect and exponential backoff.
 * Connects to the ORACLE server at ws://hostname:3847/ws
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface ServerState {
  currentMap: string | null;
  currentRoom: string | null;
  currentFloor: number;
  ocrResult: unknown | null;
  mapRooms: unknown[];
}

export interface OcrResult {
  rawText: string;
  normalized: string;
  confidence: number;
  roomId: string | null;
  mapId: string | null;
  timestamp: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

// Server message union
type ServerMessage =
  | { type: "state"; payload: ServerState }
  | { type: "ocr_result"; payload: OcrResult }
  | { type: "map_change"; payload: { mapId: string; roomCount: number } }
  | { type: "room_change"; payload: { roomId: string; floor: number } }
  | { type: "room_data"; payload: { rooms: unknown[] } }
  | { type: "pong"; payload: { ts: number } }
  | { type: "error"; payload: { message: string } };

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  lastMessage: ServerMessage | null;
  serverState: ServerState | null;
  ocrResult: OcrResult | null;
  send: (msg: unknown) => void;
  reconnect: () => void;
  latency: number | null;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const WS_RECONNECT_BASE_MS = 1000;
const WS_RECONNECT_MAX_MS = 30_000;
const WS_PING_INTERVAL_MS = 15_000;
const WS_MAX_RECONNECT_ATTEMPTS = 50;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [serverState, setServerState] = useState<ServerState | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimestamp = useRef<number>(0);
  const mountedRef = useRef(true);

  // Build WebSocket URL from current page location
  const buildWsUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = "3847";
    return `${protocol}//${host}:${port}/ws`;
  }, []);

  // Clear reconnect timer
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current !== null) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  // Clear ping timer
  const clearPingTimer = useCallback(() => {
    if (pingTimer.current !== null) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  // Connect
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
    }

    const isFirstAttempt = reconnectAttempts.current === 0;
    setStatus(isFirstAttempt ? "connecting" : "reconnecting");

    try {
      const url = buildWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;

        console.log("[WS] Connected");
        setStatus("connected");
        reconnectAttempts.current = 0;
        clearReconnectTimer();

        // Start ping interval
        clearPingTimer();
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingTimestamp.current = Date.now();
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, WS_PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const msg: ServerMessage = JSON.parse(event.data as string);
          setLastMessage(msg);

          switch (msg.type) {
            case "state":
              setServerState(msg.payload);
              break;

            case "ocr_result":
              setOcrResult(msg.payload);
              break;

            case "pong": {
              const now = Date.now();
              const sent = pingTimestamp.current;
              if (sent > 0) {
                setLatency(now - sent);
              }
              break;
            }

            case "map_change":
            case "room_change":
              // These update the serverState which is managed on the server
              // Mobile clients receive state updates via the "state" message
              break;

            case "error":
              console.warn("[WS] Server error:", msg.payload.message);
              break;
          }
        } catch {
          console.warn("[WS] Failed to parse message:", event.data);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        clearPingTimer();
        console.log(`[WS] Disconnected (code: ${event.code}, reason: ${event.reason})`);

        if (event.code === 1000) {
          // Normal close
          setStatus("disconnected");
          return;
        }

        // Attempt reconnect with exponential backoff
        reconnectAttempts.current++;
        const delay = Math.min(
          WS_RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts.current - 1),
          WS_RECONNECT_MAX_MS
        );

        if (reconnectAttempts.current <= WS_MAX_RECONNECT_ATTEMPTS) {
          console.log(
            `[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${WS_MAX_RECONNECT_ATTEMPTS})`
          );
          setStatus("reconnecting");
          reconnectTimer.current = setTimeout(connect, delay);
        } else {
          console.error("[WS] Max reconnect attempts reached");
          setStatus("disconnected");
        }
      };

      ws.onerror = (event) => {
        console.error("[WS] Error:", event);
      };
    } catch (err) {
      console.error("[WS] Failed to create WebSocket:", err);
      setStatus("disconnected");
    }
  }, [buildWsUrl, clearReconnectTimer, clearPingTimer]);

  // Send message
  const send = useCallback((msg: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    clearReconnectTimer();
    connect();
  }, [connect, clearReconnectTimer]);

  // Mount / unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearReconnectTimer();
      clearPingTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnectTimer, clearPingTimer]);

  return {
    status,
    lastMessage,
    serverState,
    ocrResult,
    send,
    reconnect,
    latency,
  };
}
