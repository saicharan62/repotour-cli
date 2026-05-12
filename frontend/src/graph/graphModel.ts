import type { Edge, Node } from "reactflow";
import type { OverlayMode, RepoProfile, UiMode } from "../types/profile";

export type ArchitectureNodeData = {
  label: string;
  path: string;
  role: string;
  kind: string;
  importance: number;
  heat: number;
  lowSignal: boolean;
  active: boolean;
  past: boolean;
  muted: boolean;
  overlay: OverlayMode;
  signals: string[];
};

export type GraphBuildOptions = {
  mode: UiMode;
  overlay: OverlayMode;
  query: string;
  focus: string;
  hideLowSignal: boolean;
  activeTraversalIndex: number;
};

export function buildExplorerGraph(profile: RepoProfile, options: GraphBuildOptions): { nodes: Node<ArchitectureNodeData>[]; edges: Edge[] } {
  if (options.mode === "runtime") return buildRuntimeGraph(profile, options);
  if (options.mode === "package") return buildPackageGraph(profile, options);
  if (options.mode === "learning") return buildLearningGraph(profile, options);
  return buildHotspotGraph(profile, options);
}

function buildRuntimeGraph(profile: RepoProfile, options: GraphBuildOptions) {
  const steps = profile.executionFlows[0]?.steps ?? [];
  const laneX = new Map([
    ["entrypoint", 0],
    ["orchestrator", 310],
    ["runtime-module", 620],
    ["unknown", 620],
    ["external-package", 930],
  ]);
  const laneCounts = new Map<string, number>();
  const nodes = steps.map((step, index): Node<ArchitectureNodeData> => {
    const lane = step.role;
    const count = laneCounts.get(lane) ?? 0;
    laneCounts.set(lane, count + 1);
    const architectureNode = profile.architectureGraph.nodes.find((node) => node.path === step.path);
    return {
      id: nodeId(step.path),
      type: "architecture",
      position: { x: laneX.get(lane) ?? 620, y: 70 + count * 130 },
      data: makeData({
        label: step.path,
        path: step.path,
        kind: step.role,
        role: step.reason,
        importance: architectureNode?.importance ?? 65 - step.depth * 10,
        lowSignal: architectureNode?.lowSignal ?? false,
        active: index === options.activeTraversalIndex,
        past: index < options.activeTraversalIndex,
        muted: index > options.activeTraversalIndex + 1 && options.activeTraversalIndex > 0,
        overlay: options.overlay,
        signals: step.signals.map((signal) => signal.label),
        heat: overlayHeat(profile, step.path, options.overlay, architectureNode?.importance ?? 50),
      }),
    };
  }).filter((node) => includeNode(node, options));
  const visible = new Set(nodes.map((node) => node.id));
  const edges = steps.slice(1).map((step, index): Edge => ({
    id: `runtime-${index}`,
    source: nodeId(steps[index]?.path ?? ""),
    target: nodeId(step.path),
    animated: index <= options.activeTraversalIndex,
    className: index <= options.activeTraversalIndex ? "runtime-edge active" : "runtime-edge",
    type: "smoothstep",
  })).filter((edge) => visible.has(edge.source) && visible.has(edge.target));
  return { nodes, edges };
}

function buildPackageGraph(profile: RepoProfile, options: GraphBuildOptions) {
  const packageByName = new Map(profile.packageMap.map((pkg) => [pkg.name, pkg]));
  const nodes = profile.packageMap.map((pkg, index): Node<ArchitectureNodeData> => ({
    id: nodeId(`pkg:${pkg.path}`),
    type: "architecture",
    position: { x: 180 + (index % 4) * 280, y: 80 + Math.floor(index / 4) * 165 },
    data: makeData({
      label: pkg.name,
      path: pkg.path,
      kind: "package",
      role: pkg.internalDependencies.length ? `Owns dependencies on ${pkg.internalDependencies.join(", ")}` : "Package boundary with no internal dependency signal.",
      importance: pkg.centrality,
      lowSignal: /fixtures|examples|playground/.test(pkg.path),
      active: false,
      past: false,
      muted: false,
      overlay: options.overlay,
      signals: pkg.signals.map((signal) => signal.label),
      heat: overlayHeat(profile, pkg.path, options.overlay, pkg.centrality),
    }),
  })).filter((node) => includeNode(node, options));
  const visible = new Set(nodes.map((node) => node.id));
  const edges = profile.packageMap.flatMap((pkg) => pkg.internalDependencies.flatMap((dependency) => {
    const target = packageByName.get(dependency);
    if (!target) return [];
    return [{
      id: `pkg-${nodeId(pkg.path)}-${nodeId(target.path)}`,
      source: nodeId(`pkg:${pkg.path}`),
      target: nodeId(`pkg:${target.path}`),
      type: "smoothstep",
      animated: false,
      className: "package-edge",
    } satisfies Edge];
  })).filter((edge) => visible.has(edge.source) && visible.has(edge.target));
  return { nodes, edges };
}

function buildLearningGraph(profile: RepoProfile, options: GraphBuildOptions) {
  const nodes = profile.readingPath.map((item, index): Node<ArchitectureNodeData> => ({
    id: nodeId(`learn:${item.path}`),
    type: "architecture",
    position: { x: 120 + index * 260, y: 160 + (index % 2) * 120 },
    data: makeData({
      label: `${index + 1}. ${item.title}`,
      path: item.path,
      kind: "learning",
      role: item.reason,
      importance: item.score,
      lowSignal: false,
      active: index === options.activeTraversalIndex,
      past: index < options.activeTraversalIndex,
      muted: false,
      overlay: options.overlay,
      signals: [`reading step ${index + 1}`],
      heat: overlayHeat(profile, item.path, "onboarding", item.score),
    }),
  })).filter((node) => includeNode(node, options));
  const visible = new Set(nodes.map((node) => node.id));
  const edges = profile.readingPath.slice(1).map((item, index): Edge => ({
    id: `learn-${index}`,
    source: nodeId(`learn:${profile.readingPath[index]?.path ?? ""}`),
    target: nodeId(`learn:${item.path}`),
    type: "smoothstep",
    animated: index <= options.activeTraversalIndex,
    className: "learning-edge",
  })).filter((edge) => visible.has(edge.source) && visible.has(edge.target));
  return { nodes, edges };
}

function buildHotspotGraph(profile: RepoProfile, options: GraphBuildOptions) {
  const nodes = profile.importantFiles.slice(0, 28).map((file, index): Node<ArchitectureNodeData> => {
    const angle = (index / Math.max(1, profile.importantFiles.length)) * Math.PI * 2;
    const radius = 180 + (index % 3) * 100;
    return {
      id: nodeId(`hot:${file.path}`),
      type: "architecture",
      position: { x: 520 + Math.cos(angle) * radius, y: 340 + Math.sin(angle) * radius },
      data: makeData({
        label: file.path,
        path: file.path,
        kind: "hotspot",
        role: file.reason,
        importance: file.score,
        lowSignal: false,
        active: index === 0,
        past: false,
        muted: false,
        overlay: options.overlay,
        signals: file.signals.map((signal) => signal.label),
        heat: overlayHeat(profile, file.path, options.overlay, file.score),
      }),
    };
  }).filter((node) => includeNode(node, options));
  const byPath = new Map(nodes.map((node) => [node.data.path, node.id]));
  const edges = profile.importGraph.flatMap((edge, index) => {
    const source = byPath.get(edge.from);
    const target = byPath.get(edge.to);
    return source && target ? [{ id: `hot-${index}`, source, target, type: "smoothstep", className: "hotspot-edge" } satisfies Edge] : [];
  }).slice(0, 60);
  return { nodes, edges };
}

function makeData(data: ArchitectureNodeData): ArchitectureNodeData {
  return data;
}

function includeNode(node: Node<ArchitectureNodeData>, options: GraphBuildOptions): boolean {
  if (options.hideLowSignal && node.data.lowSignal && options.focus !== "low") return false;
  const query = options.query.trim().toLowerCase();
  if (query && !`${node.data.label} ${node.data.path} ${node.data.kind} ${node.data.role}`.toLowerCase().includes(query)) return false;
  if (options.focus === "entrypoint") return node.data.kind === "entrypoint";
  if (options.focus === "runtime") return !node.data.lowSignal && ["entrypoint", "orchestrator", "runtime-module", "unknown", "learning", "hotspot"].includes(node.data.kind);
  if (options.focus === "low") return node.data.lowSignal;
  return true;
}

function overlayHeat(profile: RepoProfile, path: string, overlay: string, fallback: number): number {
  if (overlay === "churn") return profile.churnHotspots.find((file) => file.path === path)?.score ?? profile.timelineSignals.find((item) => item.path === path)?.score ?? 0;
  if (overlay === "centrality") return profile.architectureGraph.nodes.find((node) => node.path === path)?.importance ?? fallback;
  if (overlay === "onboarding") return profile.readingPath.find((item) => item.path === path)?.score ?? fallback * 0.6;
  return fallback;
}

function nodeId(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "_") || "root";
}
