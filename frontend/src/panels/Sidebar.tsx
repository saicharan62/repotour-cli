import type { FocusMode, OverlayMode, UiMode } from "../types/profile";
import { useExplorerStore } from "../state/explorerStore";

const modes: Array<{ mode: UiMode; title: string; copy: string; key: string }> = [
  { mode: "runtime", title: "Runtime", copy: "Entrypoints and execution lanes.", key: "1" },
  { mode: "package", title: "Package", copy: "Workspace and package topology.", key: "2" },
  { mode: "learning", title: "Learning", copy: "Guided onboarding sequence.", key: "3" },
  { mode: "hotspot", title: "Hotspot", copy: "Central and active areas.", key: "4" },
];

const focuses: FocusMode[] = ["all", "runtime", "entrypoint", "low"];
const overlays: Array<{ value: OverlayMode; label: string }> = [
  { value: "importance", label: "Importance" },
  { value: "churn", label: "Churn" },
  { value: "centrality", label: "Gravity" },
  { value: "onboarding", label: "Onboarding" },
];

export function Sidebar() {
  const { profile, mode, focus, overlay, query, setMode, setFocus, setOverlay, setQuery } = useExplorerStore();
  if (!profile) return null;

  return (
    <aside className="space-y-3">
      <section className="rounded-panel border border-line bg-white p-3">
        <h2 className="mb-3 text-sm font-bold">Exploration Mode</h2>
        <div className="grid gap-2">
          {modes.map((item) => (
            <button
              key={item.mode}
              className={`grid grid-cols-[26px_1fr] gap-2 rounded-panel border p-2 text-left ${mode === item.mode ? "border-accent bg-[#e5f3f1]" : "border-line bg-white"}`}
              onClick={() => setMode(item.mode)}
            >
              <span className="grid h-6 w-6 place-items-center rounded bg-slate-100 text-xs font-bold">{item.key}</span>
              <span>
                <span className="block font-bold">{item.title}</span>
                <span className="block text-xs text-muted">{item.copy}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-panel border border-line bg-white p-3">
        <h2 className="mb-3 text-sm font-bold">Focus</h2>
        <input
          className="w-full rounded-panel border border-line px-3 py-2 text-sm"
          value={query}
          placeholder="Search paths, roles, evidence"
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {focuses.map((item) => (
            <button
              key={item}
              className={`rounded-panel border px-2 py-1 text-sm ${focus === item ? "border-accent bg-[#e5f3f1]" : "border-line"}`}
              onClick={() => setFocus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-panel border border-line bg-white p-3">
        <h2 className="mb-3 text-sm font-bold">Visual Overlay</h2>
        <div className="grid grid-cols-2 gap-2">
          {overlays.map((item) => (
            <button
              key={item.value}
              className={`rounded-panel border px-2 py-2 text-sm ${overlay === item.value ? "border-accent bg-[#e5f3f1]" : "border-line"}`}
              onClick={() => setOverlay(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-panel border border-line bg-white p-3">
        <h2 className="mb-3 text-sm font-bold">Architecture Regions</h2>
        <div className="grid gap-2">
          {profile.repoZones.slice(0, 10).map((zone) => (
            <div key={zone.path} className="architecture-card">
              <div className="font-bold">{zone.label}</div>
              <div className="text-xs text-muted">{zone.kind} · {zone.importance}% · {zone.files} files</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-panel border border-line bg-white p-3">
        <h2 className="mb-3 text-sm font-bold">Can Ignore First</h2>
        <div className="grid gap-2">
          {profile.ignoreGuidance.length ? profile.ignoreGuidance.slice(0, 5).map((item) => (
            <div key={item.path} className="architecture-card opacity-70">
              <div className="font-bold">{item.path}</div>
              <div className="text-xs text-muted">{item.reason}</div>
            </div>
          )) : <p className="text-sm text-muted">No obvious support-only areas.</p>}
        </div>
      </section>
    </aside>
  );
}
