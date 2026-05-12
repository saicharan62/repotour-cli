import type { Analyzer, ArchitectureGraphEdge, ArchitectureGraphNode } from "../types.js";
import { isLowSignalPath, topLevelZone } from "../utils/paths.js";
import { signal } from "../utils/signals.js";

export const architectureGraphAnalyzer: Analyzer = {
  name: "architecture-graph",
  analyze(profile) {
    const nodes = new Map<string, ArchitectureGraphNode>();
    const edges = new Map<string, ArchitectureGraphEdge>();
    const addNode = (node: ArchitectureGraphNode) => {
      const existing = nodes.get(node.id);
      if (!existing) {
        nodes.set(node.id, node);
        return;
      }
      nodes.set(node.id, {
        ...existing,
        importance: Math.max(existing.importance, node.importance),
        kind: existing.kind === "entrypoint" || node.kind === "entrypoint" ? "entrypoint" : node.kind,
        role: existing.kind === "entrypoint" ? existing.role : node.role,
        signals: node.importance > existing.importance ? node.signals : existing.signals,
        lowSignal: existing.lowSignal && node.lowSignal,
      });
    };
    const addEdge = (edge: ArchitectureGraphEdge) => {
      const existing = edges.get(edge.id);
      if (existing) existing.weight += edge.weight;
      else edges.set(edge.id, edge);
    };

    for (const zone of profile.repoZones.slice(0, 14)) {
      addNode({
        id: nodeId(zone.path),
        label: zone.label,
        kind: "zone",
        path: zone.path,
        importance: zone.importance,
        role: zone.summary,
        lowSignal: isLowSignalPath(zone.path) || ["tests", "fixtures", "examples", "docs"].includes(zone.kind),
        signals: zone.signals,
      });
    }

    for (const entry of profile.entryPoints.slice(0, 8)) {
      addNode({
        id: nodeId(entry.path),
        label: entry.path,
        kind: "entrypoint",
        path: entry.path,
        importance: entry.score,
        role: entry.reason,
        lowSignal: isLowSignalPath(entry.path),
        signals: entry.signals,
      });
      addEdge({
        id: `${nodeId(topLevelZone(entry.path))}->${nodeId(entry.path)}:entry`,
        from: nodeId(topLevelZone(entry.path)),
        to: nodeId(entry.path),
        kind: "entrypoint",
        weight: 4,
        label: "entrypoint in zone",
      });
    }

    for (const file of profile.importantFiles.slice(0, 14)) {
      addNode({
        id: nodeId(file.path),
        label: file.path,
        kind: file.path.endsWith("package.json") ? "manifest" : "module",
        path: file.path,
        importance: file.score,
        role: file.reason,
        lowSignal: isLowSignalPath(file.path),
        signals: file.signals,
      });
      addEdge({
        id: `${nodeId(topLevelZone(file.path))}->${nodeId(file.path)}:contains`,
        from: nodeId(topLevelZone(file.path)),
        to: nodeId(file.path),
        kind: "contains",
        weight: 2,
        label: "contains important file",
      });
    }

    for (const relationship of profile.zoneRelationships) {
      addEdge({
        id: `${nodeId(relationship.from)}->${nodeId(relationship.to)}:zone`,
        from: nodeId(relationship.from),
        to: nodeId(relationship.to),
        kind: "imports",
        weight: relationship.weight,
        label: relationship.kind,
      });
    }

    for (const edge of profile.importGraph.slice(0, 100)) {
      if (!nodes.has(nodeId(edge.from)) || !nodes.has(nodeId(edge.to))) continue;
      addEdge({
        id: `${nodeId(edge.from)}->${nodeId(edge.to)}:import`,
        from: nodeId(edge.from),
        to: nodeId(edge.to),
        kind: "imports",
        weight: 1,
        label: "imports",
      });
    }

    for (const item of profile.readingPath) {
      if (!nodes.has(nodeId(item.path))) {
        addNode({
          id: nodeId(item.path),
          label: item.path,
          kind: "module",
          path: item.path,
          importance: item.score,
          role: item.reason,
          lowSignal: isLowSignalPath(item.path),
          signals: [signal("suggested reading path", item.score)],
        });
      }
    }

    return {
      ...profile,
      architectureGraph: {
        nodes: [...nodes.values()].sort((a, b) => b.importance - a.importance).slice(0, 36),
        edges: [...edges.values()].sort((a, b) => b.weight - a.weight).slice(0, 80),
      },
    };
  },
};

function nodeId(path: string): string {
  return path.replace(/[^a-zA-Z0-9_-]+/g, "_") || "root";
}
