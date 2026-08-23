import { useEffect, useState } from "react";
import { TitleBar } from "./components/layout/TitleBar.js";
import { Sidebar } from "./components/layout/Sidebar.js";
import { MainContent } from "./components/layout/MainContent.js";
import { StatusBar } from "./components/layout/StatusBar.js";
import { UpdateBanner } from "./components/UpdateBanner.js";
import { SetupWizard } from "./components/setup/SetupWizard.js";
import { useOcrStore } from "./stores/ocr-store.js";
import { useMapStore } from "./stores/map-store.js";

const SETUP_KEY = "oracle.setupComplete";

export function App() {
  const setResult = useOcrStore((s) => s.setResult);
  const highlightRoom = useMapStore((s) => s.highlightRoom);
  const [showWizard, setShowWizard] = useState(() => {
    try {
      return localStorage.getItem(SETUP_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const completeSetup = () => {
    try {
      localStorage.setItem(SETUP_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowWizard(false);
  };

  useEffect(() => {
    // Listen for OCR results from main process
    const unsub = window.oracle?.on("ocr:result", (...args) => {
      const result = args[0] as { roomId: string | null; rawText: string; confidence: number; mapId: string | null };
      setResult(result);
      if (result.roomId) highlightRoom(result.roomId);
    });
    return () => unsub?.();
  }, [setResult, highlightRoom]);

  if (showWizard) {
    return <SetupWizard onComplete={completeSetup} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--oracle-bg-primary)] overflow-hidden">
      <TitleBar />
      <UpdateBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
    </div>
  );
}
