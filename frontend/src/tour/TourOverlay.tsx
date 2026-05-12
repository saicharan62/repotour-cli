import { useExplorerStore } from "../state/explorerStore";
import type { RepoProfile } from "../types/profile";

export function TourOverlay() {
  const { profile, tourOpen, tourIndex, closeTour, setTourIndex, select, setTraversalPlaying } = useExplorerStore();
  if (!profile || !tourOpen) return null;
  const steps = tourSteps(profile);
  const step = steps[Math.min(tourIndex, steps.length - 1)];
  if (!step) return null;

  const highlight = () => {
    const node = profile.architectureGraph.nodes.find((candidate) => candidate.path === step.path);
    select(node?.id);
    setTraversalPlaying(true);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 grid place-items-center px-5">
      <section className="pointer-events-auto w-[min(720px,calc(100vw-40px))] rounded-panel border border-line bg-white/95 p-5 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#eef4f3] px-2 py-1 text-xs text-[#17433f]">Runtime tour · step {Math.min(tourIndex + 1, steps.length)} of {steps.length}</span>
          <button className="rounded-panel border border-line px-3 py-1 text-sm" onClick={closeTour}>Close</button>
        </div>
        <h2 className="mt-3 text-xl font-bold">{step.title}</h2>
        <p className="mt-2 text-muted">{step.copy}</p>
        <p className="mt-2 text-sm"><code>{step.path}</code></p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-accent transition-all" style={{ width: `${((Math.min(tourIndex + 1, steps.length)) / Math.max(1, steps.length)) * 100}%` }} />
          </div>
          <div className="flex gap-2">
            <button className="rounded-panel border border-line px-3 py-2" onClick={() => setTourIndex(Math.max(0, tourIndex - 1))}>Previous</button>
            <button className="rounded-panel border border-line px-3 py-2" onClick={highlight}>Highlight</button>
            <button className="rounded-panel border border-line px-3 py-2" onClick={() => setTourIndex(Math.min(steps.length - 1, tourIndex + 1))}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function tourSteps(profile: RepoProfile) {
  const flowSteps = profile.executionFlows[0]?.steps.slice(0, 5).map((step, index) => ({
    title: index === 0 ? "Execution begins here" : "Control moves through this runtime step",
    copy: step.reason,
    path: step.path,
  })) ?? [];
  if (flowSteps.length) return flowSteps;
  return profile.readingPath.map((item, index) => ({
    title: `Reading step ${index + 1}: ${item.title}`,
    copy: item.reason,
    path: item.path,
  }));
}
