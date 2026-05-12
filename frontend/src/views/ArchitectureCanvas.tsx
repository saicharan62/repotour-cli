import { ArchitectureCard, type ArchitectureCardModel } from "../components/ArchitectureCard";
import { useExplorerStore } from "../state/explorerStore";
import type { RepoProfile } from "../types/profile";

export function ArchitectureCanvas() {
  const { profile, mode, selectedId, select, startTour } = useExplorerStore();
  if (!profile) return null;

  const cards = buildCards(profile, mode);

  return (
    <section className="grid gap-3">
      <div className="rounded-panel border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{titleFor(mode)}</h2>
            <p className="text-sm text-muted">{copyFor(mode)}</p>
          </div>
          <button className="rounded-panel border border-line px-3 py-2 hover:border-accent" onClick={startTour}>
            Take a Tour
          </button>
        </div>
      </div>
      <div className="min-h-[560px] rounded-panel border border-line bg-[#fbfcfe] p-5">
        {mode === "runtime" ? <RuntimeLanes cards={cards} selectedId={selectedId} onSelect={select} /> : null}
        {mode !== "runtime" ? (
          <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
            {cards.map((card) => (
              <ArchitectureCard key={card.id} card={card} selected={card.id === selectedId} onSelect={select} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RuntimeLanes({ cards, selectedId, onSelect }: { cards: ArchitectureCardModel[]; selectedId?: string; onSelect(id: string): void }) {
  const lanes = [
    ["Entrypoint", "entrypoint"],
    ["Orchestration", "orchestrator"],
    ["Runtime Modules", "runtime-module"],
    ["External / Output", "external-package"],
  ];
  return (
    <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-1">
      {lanes.map(([title, kind]) => (
        <section key={kind} className="min-h-[420px] rounded-panel border border-line bg-white/80 p-3">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">{title}</h3>
          <div className="grid gap-2">
            {cards.filter((card) => card.kind === kind || (kind === "runtime-module" && card.kind === "unknown")).map((card) => (
              <ArchitectureCard key={card.id} card={card} selected={card.id === selectedId} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function buildCards(profile: RepoProfile, mode: string): ArchitectureCardModel[] {
  if (mode === "runtime") {
    return (profile.executionFlows[0]?.steps ?? []).map((step) => ({
      id: profile.architectureGraph.nodes.find((node) => node.path === step.path)?.id ?? `flow:${step.path}`,
      title: step.path,
      path: step.path,
      kind: step.role,
      role: step.reason,
      importance: 70 - step.depth * 8,
      signals: step.signals,
    }));
  }
  if (mode === "package") {
    return profile.packageMap.map((pkg) => ({
      id: `pkg:${pkg.path}`,
      title: pkg.name,
      path: pkg.path,
      kind: "package",
      role: pkg.internalDependencies.length ? `Internal deps: ${pkg.internalDependencies.join(", ")}` : "Package boundary",
      importance: pkg.centrality,
      signals: pkg.signals,
    }));
  }
  if (mode === "learning") {
    return profile.readingPath.map((item, index) => ({
      id: profile.architectureGraph.nodes.find((node) => node.path === item.path)?.id ?? `read:${item.path}`,
      title: `${index + 1}. ${item.title}`,
      path: item.path,
      kind: "learning",
      role: item.reason,
      importance: item.score,
    }));
  }
  return profile.importantFiles.map((file) => ({
    id: profile.architectureGraph.nodes.find((node) => node.path === file.path)?.id ?? `hot:${file.path}`,
    title: file.path,
    path: file.path,
    kind: "hotspot",
    role: file.reason,
    importance: file.score,
    signals: file.signals,
  }));
}

function titleFor(mode: string): string {
  return mode === "runtime" ? "Runtime Map" : mode === "package" ? "Package Topology" : mode === "learning" ? "Learning Path" : "Hotspot Map";
}

function copyFor(mode: string): string {
  return mode === "runtime"
    ? "Follow likely execution from entrypoint to orchestration and output."
    : mode === "package"
      ? "Inspect package boundaries, workspace shape, and internal dependencies."
      : mode === "learning"
        ? "Walk the recommended sequence for understanding the codebase."
        : "Find central, active, and coordination-heavy modules.";
}
