/**
 * ORACLE R6 Siege Companion - Express + WebSocket Server
 *
 * Runs inside the Electron main process on port 3847.
 * Serves the mobile PWA static files and provides real-time
 * state synchronization via WebSocket.
 */

import express from "express";
import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateQrDataUrl, getBestLocalIp, buildConnectionUrl } from "./qr.js";
import type { OcrResult } from "@oracle/domain";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env["ORACLE_PORT"] ?? "3847", 10);
const WS_PATH = "/ws";

// Resolve paths relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The mobile PWA dist is served as static files
const MOBILE_DIST = path.resolve(__dirname, "../../apps/mobile/dist");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientState {
  id: string;
  connectedAt: number;
  lastMessageAt: number;
  room: string | null;
  map: string | null;
}

interface ServerState {
  currentMap: string | null;
  currentRoom: string | null;
  currentFloor: number;
  ocrResult: OcrResult | null;
  mapRooms: MapRoomData[];
}

interface MapRoomData {
  roomId: string;
  name: string;
  displayName: string;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Outgoing message types from server to client
type ServerMessage =
  | { type: "state"; payload: ServerState }
  | { type: "ocr_result"; payload: OcrResult }
  | { type: "map_change"; payload: { mapId: string; roomCount: number } }
  | { type: "room_change"; payload: { roomId: string; floor: number } }
  | { type: "room_data"; payload: { rooms: MapRoomData[] } }
  | { type: "pong"; payload: { ts: number } }
  | { type: "error"; payload: { message: string } };

// Incoming message types from client to server
type ClientMessage =
  | { type: "ping"; payload?: unknown }
  | { type: "request_rooms"; payload: { mapId: string; floor?: number } }
  | { type: "set_room"; payload: { roomId: string } };

// ---------------------------------------------------------------------------
// Server state
// ---------------------------------------------------------------------------

const state: ServerState = {
  currentMap: null,
  currentRoom: null,
  currentFloor: 0,
  ocrResult: null,
  mapRooms: [],
};

const clients = new Map<string, ClientState>();
let clientIdCounter = 0;

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

// CORS for local development
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// JSON parsing
app.use(express.json());

// Serve mobile PWA static files
app.use(express.static(MOBILE_DIST, {
  index: "index.html",
  maxAge: process.env["NODE_ENV"] === "production" ? "1h" : 0,
}));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    clients: clients.size,
    version: "0.1.0",
  });
});

// QR code generation
app.get("/api/qr", async (_req, res) => {
  try {
    const ip = getBestLocalIp();
    if (!ip) {
      res.status(500).json({
        error: "No local network interface found. Connect to Wi-Fi first.",
      });
      return;
    }

    const url = buildConnectionUrl(ip, PORT);
    const qr = await generateQrDataUrl(url);

    res.json({ url, qr, ip, port: PORT });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Current state endpoint (REST fallback)
app.get("/api/state", (_req, res) => {
  res.json(state);
});

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------

const server = createServer(app);

const wss = new WebSocketServer({
  server,
  path: WS_PATH,
});

function broadcast(message: ServerMessage): void {
  const data = JSON.stringify(message);
  for (const [, client] of clients) {
    // We don't track ws objects here; we send to all in the upgrade handler
  }
  // Actually we need to track the ws reference - see connection handler
}

function broadcastToAll(message: ServerMessage): void {
  const data = JSON.stringify(message);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function sendTo(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// ---------------------------------------------------------------------------
// WebSocket connection handling
// ---------------------------------------------------------------------------

wss.on("connection", (ws, req) => {
  const clientId = `client-${++clientIdCounter}`;
  const clientState: ClientState = {
    id: clientId,
    connectedAt: Date.now(),
    lastMessageAt: Date.now(),
    room: null,
    map: null,
  };

  clients.set(clientId, clientState);

  console.log(
    `[WS] Client connected: ${clientId} (total: ${clients.size}) from ${req.socket.remoteAddress}`
  );

  // Send current state on connect
  sendTo(ws, { type: "state", payload: state });

  // Handle incoming messages
  ws.on("message", (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());
      clientState.lastMessageAt = Date.now();

      switch (msg.type) {
        case "ping": {
          sendTo(ws, { type: "pong", payload: { ts: Date.now() } });
          break;
        }

        case "request_rooms": {
          // In a full implementation, this would query the database
          // For now, echo back what we have
          sendTo(ws, {
            type: "room_data",
            payload: { rooms: state.mapRooms },
          });
          break;
        }

        case "set_room": {
          clientState.room = msg.payload.roomId;
          break;
        }

        default: {
          sendTo(ws, {
            type: "error",
            payload: { message: `Unknown message type: ${(msg as { type: string }).type}` },
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid message";
      sendTo(ws, { type: "error", payload: { message } });
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    clients.delete(clientId);
    console.log(
      `[WS] Client disconnected: ${clientId} (remaining: ${clients.size})`
    );
  });

  // Handle errors
  ws.on("error", (err) => {
    console.error(`[WS] Error on ${clientId}:`, err.message);
    clients.delete(clientId);
  });
});

// ---------------------------------------------------------------------------
// Public API for Electron main process to push updates
// ---------------------------------------------------------------------------

/**
 * Push OCR results to all connected mobile clients.
 * Called from the Electron main process when OCR produces a new result.
 */
export function pushOcrResult(result: OcrResult): void {
  state.ocrResult = result;

  if (result.mapId) {
    state.currentMap = result.mapId;
  }
  if (result.roomId) {
    state.currentRoom = result.roomId;
  }

  broadcastToAll({ type: "ocr_result", payload: result });
}

/**
 * Push map/room change to all connected mobile clients.
 */
export function pushMapChange(mapId: string, rooms: MapRoomData[]): void {
  state.currentMap = mapId;
  state.mapRooms = rooms;

  broadcastToAll({
    type: "map_change",
    payload: { mapId, roomCount: rooms.length },
  });
}

/**
 * Push room change to all connected mobile clients.
 */
export function pushRoomChange(roomId: string, floor: number): void {
  state.currentRoom = roomId;
  state.currentFloor = floor;

  broadcastToAll({ type: "room_change", payload: { roomId, floor } });
}

/**
 * Get the number of connected mobile clients.
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Get the QR code data for the current network.
 */
export async function getQrCode(): Promise<{ url: string; qr: string } | null> {
  const ip = getBestLocalIp();
  if (!ip) return null;

  const url = buildConnectionUrl(ip, PORT);
  const qr = await generateQrDataUrl(url);
  return { url, qr };
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

server.listen(PORT, "0.0.0.0", () => {
  const ip = getBestLocalIp();
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   ORACLE R6 Siege Companion Server       ║`);
  console.log(`  ╠══════════════════════════════════════════╣`);
  console.log(`  ║  HTTP  : http://localhost:${PORT}          ║`);
  console.log(`  ║  WS    : ws://localhost:${PORT}${WS_PATH}      ║`);
  console.log(`  ║  Local : http://${ip ?? "N/A"}:${PORT}  ║`);
  console.log(`  ║  Mobile: Scan QR at /api/qr              ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

function shutdown(signal: string): void {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  // Close all WebSocket connections
  wss.clients.forEach((ws) => {
    ws.close(1001, "Server shutting down");
  });

  // Close WebSocket server
  wss.close(() => {
    console.log("[Server] WebSocket server closed.");
  });

  // Close HTTP server
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout.");
    process.exit(1);
  }, 5_000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle Windows Ctrl+C
if (process.platform === "win32") {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on("SIGINT", () => process.emit("SIGINT" as NodeJS.Signals));
}

// Export for Electron main process integration
export { app, server, wss, state };
