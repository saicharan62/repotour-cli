import type { ImportEdge } from "../types.js";

export type FileCentrality = {
  fanout: number;
  fanin: number;
};

export function computeCentrality(edges: ImportEdge[]): Map<string, FileCentrality> {
  const centrality = new Map<string, FileCentrality>();
  const ensure = (filePath: string) => {
    const current = centrality.get(filePath) ?? { fanout: 0, fanin: 0 };
    centrality.set(filePath, current);
    return current;
  };

  for (const edge of edges) {
    ensure(edge.from).fanout += 1;
    if (edge.kind === "static" && !edge.to.startsWith(".")) ensure(edge.to).fanin += 1;
  }

  return centrality;
}

export function outgoingInternalCount(edges: ImportEdge[], filePath: string): number {
  return edges.filter((edge) => edge.from === filePath && edge.kind === "static" && !edge.to.startsWith(".")).length;
}

export function incomingInternalCount(edges: ImportEdge[], filePath: string): number {
  return edges.filter((edge) => edge.to === filePath && edge.kind === "static").length;
}
