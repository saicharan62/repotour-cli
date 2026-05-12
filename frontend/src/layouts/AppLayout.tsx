import { ArchitectureCanvas } from "../views/ArchitectureCanvas";
import { InspectorPanel } from "../panels/InspectorPanel";
import { Sidebar } from "../panels/Sidebar";
import { TourOverlay } from "../tour/TourOverlay";
import { useExplorerStore } from "../state/explorerStore";
import { useEffect } from "react";

export function AppLayout() {
  const profile = useExplorerStore((state) => state.profile);
  const setMode = useExplorerStore((state) => state.setMode);
  const startTour = useExplorerStore((state) => state.startTour);
  const setTraversalPlaying = useExplorerStore((state) => state.setTraversalPlaying);
  const traversalPlaying = useExplorerStore((state) => state.traversalPlaying);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "1") setMode("runtime");
      if (event.key === "2") setMode("package");
      if (event.key === "3") setMode("learning");
      if (event.key === "4") setMode("hotspot");
      if (event.key.toLowerCase() === "t") startTour();
      if (event.key === " ") {
        event.preventDefault();
        setTraversalPlaying(!traversalPlaying);
      }
      if (event.key === "/") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder^="Search"]')?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setMode, setTraversalPlaying, startTour, traversalPlaying]);

  if (!profile) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.repoName}</h1>
            <p className="mt-1 max-w-4xl text-sm text-muted">{profile.architectureSummary}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-sm">
            <span className="rounded-full border border-line px-3 py-1">{profile.primaryLanguage}</span>
            <span className="rounded-full border border-line px-3 py-1">{profile.architectureStyle?.name ?? "Unclassified"}</span>
            <span className="rounded-full border border-line px-3 py-1">{profile.repoZones.length} zones</span>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1480px] grid-cols-[280px_minmax(0,1fr)_340px] gap-4 px-6 py-4 max-xl:grid-cols-1">
        <Sidebar />
        <ArchitectureCanvas />
        <InspectorPanel />
      </main>
      <TourOverlay />
    </div>
  );
}
