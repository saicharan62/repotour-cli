import { useExplorerStore } from "../state/explorerStore";

export function InspectorPanel() {
  const { profile, selectedId } = useExplorerStore();
  if (!profile) return null;
  const node = profile.architectureGraph.nodes.find((item) => item.id === selectedId) ?? profile.architectureGraph.nodes[0];

  return (
    <aside className="space-y-3">
      <section className="rounded-panel border border-line bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="break-words text-lg font-bold">{node?.label ?? "Inspector"}</h2>
          <span className="rounded-full bg-[#eef4f3] px-2 py-1 text-xs text-[#17433f]">{node?.kind ?? "none"}</span>
        </div>
        <p className="mt-2 text-sm text-muted">{node?.role ?? "Select a card to inspect its role and evidence."}</p>
        <Evidence title="Why this matters" items={node?.signals.map((signal) => signal.label) ?? []} />
        <Evidence
          title="Depends on"
          items={profile.architectureGraph.edges.filter((edge) => edge.from === node?.id).map((edge) => profile.architectureGraph.nodes.find((candidate) => candidate.id === edge.to)?.label ?? edge.to)}
        />
        <Evidence
          title="Used by"
          items={profile.architectureGraph.edges.filter((edge) => edge.to === node?.id).map((edge) => profile.architectureGraph.nodes.find((candidate) => candidate.id === edge.from)?.label ?? edge.from)}
        />
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
