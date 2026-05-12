import { useExplorerStore } from "../state/explorerStore";
import type { RepoProfile } from "../types/profile";

export function TourOverlay() {
  const { profile, tourOpen, tourIndex, closeTour, nextTour, previousTour, select } = useExplorerStore();
  if (!profile || !tourOpen) return null;
  const steps = tourSteps(profile);
  const step = steps[Math.min(tourIndex, steps.length - 1)];
  if (!step) return null;

  const highlight = () => {
    const node = profile.architectureGraph.nodes.find((candidate) => candidate.path === step.path);
    select(node?.id);
  };

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-100/70 backdrop-blur-sm">
      <section className="w-[min(640px,calc(100vw-40px))] rounded-panel border border-line bg-white p-5 shadow-xl">
        <span className="rounded-full bg-[#eef4f3] px-2 py-1 text-xs text-[#17433f]">Step {Math.min(tourIndex + 1, steps.length)} of {steps.length}</span>
        <h2 className="mt-3 text-xl font-bold">{step.title}</h2>
        <p className="mt-2 text-muted">{step.copy}</p>
        <p className="mt-2 text-sm"><code>{step.path}</code></p>
        <div className="mt-5 flex justify-between gap-3">
          <button className="rounded-panel border border-line px-3 py-2" onClick={closeTour}>Close</button>
          <div className="flex gap-2">
            <button className="rounded-panel border border-line px-3 py-2" onClick={previousTour}>Previous</button>
            <button className="rounded-panel border border-line px-3 py-2" onClick={highlight}>Highlight</button>
            <button className="rounded-panel border border-line px-3 py-2" onClick={nextTour}>Next</button>
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
