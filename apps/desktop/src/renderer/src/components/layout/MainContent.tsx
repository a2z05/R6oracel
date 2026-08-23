import { TacticalMap } from "../map/TacticalMap.js";
import { RoomInfo } from "../room/RoomInfo.js";
import { TacticalCards } from "../cards/TacticalCards.js";
import { SettingsPanel } from "../settings/SettingsPanel.js";
import { IntelPanel } from "../intel/IntelPanel.js";
import { SpawnPeeks } from "../peeks/SpawnPeeks.js";
import { useUIStore } from "../../stores/ui-store.js";

export function MainContent() {
  const showSettings = useUIStore((s) => s.showSettings);
  const showIntel = useUIStore((s) => s.showIntel);
  const showPeeks = useUIStore((s) => s.showPeeks);

  if (showSettings && !showIntel && !showPeeks) {
    return (
      <div className="flex-1 overflow-y-auto">
        <SettingsPanel />
      </div>
    );
  }

  if (showIntel) {
    return (
      <div className="flex-1 overflow-hidden">
        <IntelPanel />
      </div>
    );
  }

  if (showPeeks) {
    return (
      <div className="flex-1 overflow-hidden">
        <SpawnPeeks />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Map */}
      <div className="flex-1 relative">
        <TacticalMap />
      </div>

      {/* Right panel: Room info + Cards */}
      <div className="w-80 flex flex-col border-l border-[var(--oracle-border)] overflow-y-auto shrink-0">
        <RoomInfo />
        <TacticalCards />
      </div>
    </div>
  );
}
