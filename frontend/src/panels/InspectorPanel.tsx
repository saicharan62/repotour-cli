import { useExplorerStore } from "../state/explorerStore";
import type { ArchitectureGraphNode } from "../../../src/types";
import type { RepoProfile } from "../types/profile";

export function InspectorPanel() {
  const { profile, selectedId } = useExplorerStore();
  if (!profile) return null;
  const node = profile.architectureGraph.nodes.find((item) => item.id === selectedId) ?? profile.architectureGraph.nodes[0];
  const incomingEdges = profile.architectureGraph.edges.filter((edge) => edge.to === node?.id);
  const outgoingEdges = profile.architectureGraph.edges.filter((edge) => edge.from === node?.id);
  const incoming = incomingEdges.map((edge) => profile.architectureGraph.nodes.find((candidate) => candidate.id === edge.from)?.label ?? edge.from);
  const outgoing = outgoingEdges.map((edge) => profile.architectureGraph.nodes.find((candidate) => candidate.id === edge.to)?.label ?? edge.to);
  const relatedImports = profile.importGraph.filter((edge) => edge.from === node?.path || edge.to === node?.path);
  const churn = profile.churnHotspots.find((file) => file.path === node?.path);
  const readingIndex = profile.readingPath.findIndex((item) => item.path === node?.path);

  return (
    <aside className="space-y-3">
      <section className="rounded-panel border border-line bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="break-words text-lg font-bold">{node?.label ?? "Inspector"}</h2>
          <span className="rounded-full bg-[#eef4f3] px-2 py-1 text-xs text-[#17433f]">{node?.kind ?? "none"}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">{architecturalInsight(node, incoming.length, outgoing.length, churn?.commits, readingIndex)}</p>
        <Evidence title="Why this matters" items={node?.signals.map((signal) => explainSignal(signal.label)) ?? []} />
        <Evidence title="Dependency influence" items={[
          outgoing.length ? `Sends flow into ${outgoing.length} visible area${outgoing.length === 1 ? "" : "s"}.` : "No outgoing architecture relationships in this lens.",
          incoming.length ? `Receives influence from ${incoming.length} visible area${incoming.length === 1 ? "" : "s"}.` : "No incoming architecture relationships in this lens.",
          churn ? `Recently active: ${churn.commits} commits with +${churn.additions}/-${churn.deletions}.` : "No recent churn hotspot signal.",
        ]} />
        <Evidence title="Depends on" items={outgoing.length ? outgoing : ["No outgoing graph relationships in this lens."]} />
        <Evidence title="Used by" items={incoming.length ? incoming : ["No incoming graph relationships in this lens."]} />
        <Evidence title="Code context preview" items={codePreview(node?.path, relatedImports, profile.readmeSections.map((section) => section.title))} />
        <Evidence title="Read this next" items={recommendNext(node?.path, profile)} />
      </section>
      <section className="rounded-panel border border-line bg-white p-4">
        <h2 className="mb-3 text-sm font-bold">Active Areas</h2>
        <div className="grid gap-2">
          {profile.timelineSignals.slice(0, 8).map((item) => (
            <div key={item.path} className="architecture-card">
              <div className="font-bold">{item.path}</div>
              <div className="text-xs text-muted">{item.kind} · {item.summary}</div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function Evidence({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 rounded-panel border border-line bg-slate-50 p-3">
      <div className="text-sm font-bold">{title}</div>
      {items.length ? (
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {items.slice(0, 8).map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No evidence recorded.</p>
      )}
    </div>
  );
}

function architecturalInsight(
  node: ArchitectureGraphNode | undefined,
  incoming: number,
  outgoing: number,
  churnCommits: number | undefined,
  readingIndex: number,
): string {
  if (!node) return "Select a module, zone, package, or flow step to inspect architectural context.";
  const role = node.kind === "entrypoint"
    ? "This is a likely starting point for execution."
    : node.kind === "zone"
      ? "This is an architectural region that groups related repository behavior."
      : node.kind === "package"
        ? "This represents package ownership and dependency boundary."
        : "This module participates in the repository architecture map.";
  const influence = incoming + outgoing > 4
    ? " Several relationships converge here, so it is useful for understanding coordination."
    : outgoing > incoming
      ? " It pushes control or dependencies outward into nearby modules."
      : incoming > 0
        ? " It is referenced by other architecture nodes and may be consumed as shared behavior."
        : " It is currently isolated in this focused lens.";
  const activity = churnCommits ? ` It also has recent development activity across ${churnCommits} commits.` : "";
  const onboarding = readingIndex >= 0 ? ` It appears in the suggested reading path at step ${readingIndex + 1}.` : "";
  return `${role}${influence}${activity}${onboarding}`;
}

function explainSignal(signal: string): string {
  if (signal.includes("imports")) return signal.replace("imports", "Pulls in") + ", which suggests orchestration or coordination responsibility.";
  if (signal.includes("imported by")) return signal + ", so other code depends on this area.";
  if (signal.includes("entrypoint")) return signal + ", making it relevant to startup understanding.";
  if (signal.includes("churn")) return signal + ", which points to active development pressure.";
  return signal;
}

function codePreview(path: string | undefined, imports: Array<{ from: string; to: string; kind: string }>, readmeTitles: string[]): string[] {
  if (!path) return ["No path selected."];
  const outgoing = imports.filter((item) => item.from === path).slice(0, 5).map((item) => `imports ${item.to}`);
  const incoming = imports.filter((item) => item.to === path).slice(0, 5).map((item) => `imported by ${item.from}`);
  const snippets = [...outgoing, ...incoming];
  if (snippets.length) return snippets;
  if (path.toLowerCase().includes("readme")) return readmeTitles.slice(0, 5).map((title) => `README section: ${title}`);
  return ["No import preview in the sampled graph."];
}

function recommendNext(path: string | undefined, profile: RepoProfile): string[] {
  const currentIndex = profile.readingPath.findIndex((item) => item.path === path);
  if (currentIndex >= 0) {
    const next = profile.readingPath[currentIndex + 1];
    return next ? [`Next reading step: ${next.path} - ${next.reason}`] : ["This is the final suggested reading step."];
  }
  const related = profile.architectureGraph.edges.find((edge) => profile.architectureGraph.nodes.find((node) => node.id === edge.from)?.path === path);
  if (related) {
    const target = profile.architectureGraph.nodes.find((node) => node.id === related.to);
    if (target) return [`Follow relationship to ${target.path}.`];
  }
  return profile.readingPath[0] ? [`Start with ${profile.readingPath[0].path}.`] : ["No reading recommendation available."];
}
