import { useEffect } from "react";
import { TitleBar } from "./components/layout/TitleBar.js";
import { Sidebar } from "./components/layout/Sidebar.js";
import { MainContent } from "./components/layout/MainContent.js";
import { StatusBar } from "./components/layout/StatusBar.js";
import { UpdateBanner } from "./components/UpdateBanner.js";
import { useOcrStore } from "./stores/ocr-store.js";
import { useMapStore } from "./stores/map-store.js";

export function App() {
  const setResult = useOcrStore((s) => s.setResult);
  const highlightRoom = useMapStore((s) => s.highlightRoom);

  useEffect(() => {
    // Listen for OCR results from main process
    const unsub = window.oracle?.on("ocr:result", (...args) => {
      const result = args[0] as { roomId: string | null; rawText: string; confidence: number; mapId: string | null };
      setResult(result);
      if (result.roomId) highlightRoom(result.roomId);
    });
    return () => unsub?.();
  }, [setResult, highlightRoom]);

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
