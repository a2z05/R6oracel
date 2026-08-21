/**
 * ORACLE R6 Siege Companion - Mobile PWA Main App
 *
 * Responsive dark layout with WebSocket connection,
 * real-time room data, tactical map, and strategy cards.
 */

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useRoomData } from "./hooks/useRoomData";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { MobileRoomInfo } from "./components/MobileRoomInfo";
import { MobileMap } from "./components/MobileMap";
import { MobileCards, type TacticalCard } from "./components/MobileCards";

// ---------------------------------------------------------------------------
// Demo/tactical cards (would come from server in full implementation)
// ---------------------------------------------------------------------------

const DEMO_CARDS: TacticalCard[] = [
  {
    id: "def-1",
    title: "Anchor Position",
    module: "site_setup",
    body: "Hold from behind the bomb chassis. Use utility to deny hard breach from the main wall. Rotate to connector if pressured.",
    phase: "defense_prep",
    priority: 4,
  },
  {
    id: "def-2",
    title: "Rotation Route",
    module: "rotate_routes",
    body: "Impact or rotation hole between Site A and Site B through the interior wall. Watch for vertical play from above.",
    phase: "defense_prep",
    priority: 3,
  },
  {
    id: "atk-1",
    title: "Entry Route",
    module: "spawn_peek",
    body: "Push from Main Stairs with drone intel. Clear common anchor positions before advancing. Use claymore on flank.",
    phase: "attack",
    priority: 5,
  },
  {
    id: "atk-2",
    title: "Plant Position",
    module: "plant_tips",
    body: "Default plant behind the bomb chassis. Smoke off rotation to cover. Post-plant hold from the window angle.",
    phase: "post_plant",
    priority: 4,
  },
  {
    id: "def-3",
    title: "Op Pick: Mute",
    module: "operator_tips",
    body: "Place jammers on reinforce walls to prevent hard breach. Also covers nearby drone holes and default plant spots.",
    phase: "defense_prep",
    priority: 3,
  },
];

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export function App() {
  const {
    status,
    serverState,
    ocrResult,
    latency,
    reconnect,
  } = useWebSocket();

  const roomData = useRoomData(serverState, ocrResult);

  // Use tactical cards from server if available, otherwise demo
  const [tacticalCards, setTacticalCards] = useState<TacticalCard[]>(DEMO_CARDS);

  // Parse cards from server messages
  useEffect(() => {
    if (serverState?.mapRooms && serverState.mapRooms.length > 0) {
      // In a full implementation, cards would come via a dedicated message type
      // For now, we use demo cards
    }
  }, [serverState]);

  const handleRoomTap = useCallback((roomId: string) => {
    console.log("[App] Room tapped:", roomId);
    // Could send a message to the server to request room details
  }, []);

  const handleCardTap = useCallback((cardId: string) => {
    console.log("[App] Card tapped:", cardId);
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return (
    <div className="h-full w-full bg-surface-base safe-area-top safe-area-bottom">
      {/* Main scrollable content */}
      <div className="h-full overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Oracle logo mark */}
              <div className="w-8 h-8 rounded-lg bg-oracle-gold/10 border border-oracle-gold/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-oracle-gold"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary tracking-tight">
                  ORACLE
                </h1>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">
                  R6 Siege Companion
                </p>
              </div>
            </div>

            <ConnectionStatus
              status={status}
              latency={latency}
              onReconnect={reconnect}
            />
          </header>

          {/* Connection lost overlay */}
          {(status === "disconnected" || status === "reconnecting") && (
            <div className="glass-gold rounded-xl p-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <svg
                    className="w-5 h-5 text-oracle-gold animate-pulse-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {status === "reconnecting"
                      ? "Reconnecting to server..."
                      : "Disconnected from server"}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Make sure the Electron app is running on the same network
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Room Info */}
          <MobileRoomInfo
            mapId={roomData.currentMap}
            room={roomData.activeRoom}
            floor={roomData.currentFloor}
            confidence={roomData.confidence}
            ocrText={roomData.ocrResult?.rawText ?? null}
            isActive={roomData.isActive}
          />

          {/* Tactical Map */}
          <MobileMap
            rooms={roomData.rooms}
            activeRoomId={roomData.currentRoom}
            floor={roomData.currentFloor}
            onRoomTap={handleRoomTap}
          />

          {/* Tactical Cards */}
          <MobileCards
            cards={tacticalCards}
            onCardTap={handleCardTap}
          />

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <ActionButton
                icon="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                label="Callouts"
              />
              <ActionButton
                icon="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                label="Ping Map"
              />
              <ActionButton
                icon="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                label="Settings"
              />
            </div>
          </div>

          {/* Footer spacer for safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action Button sub-component
// ---------------------------------------------------------------------------

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      className="
        glass rounded-xl p-3
        flex flex-col items-center gap-1.5
        transition-all duration-200
        active:scale-95 active:bg-oracle-gold/10
        border border-border-subtle
        hover:border-oracle-gold/10
      "
    >
      <svg
        className="w-5 h-5 text-oracle-gold/70"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={icon} />
      </svg>
      <span className="text-[10px] text-text-secondary font-medium">
        {label}
      </span>
    </button>
  );
}
