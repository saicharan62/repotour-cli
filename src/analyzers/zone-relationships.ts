import type { Analyzer, ZoneRelationship } from "../types.js";
import { topLevelZone } from "../utils/paths.js";

export const zoneRelationshipsAnalyzer: Analyzer = {
  name: "zone-relationships",
  analyze(profile) {
    const zonePaths = new Set(profile.repoZones.map((zone) => zone.path));
    const relationships = new Map<string, ZoneRelationship>();

    for (const edge of profile.importGraph) {
      if (edge.kind !== "static") continue;
      const from = topLevelZone(edge.from);
      const to = topLevelZone(edge.to);
      if (from === to || !zonePaths.has(from) || !zonePaths.has(to)) continue;
      const key = `${from}->${to}`;
      const existing = relationships.get(key) ?? {
        from,
        to,
        kind: classifyRelationship(from, to),
        weight: 0,
        evidence: [],
      };
      existing.weight += 1;
      if (existing.evidence.length < 4) existing.evidence.push(`${edge.from} imports ${edge.to}`);
      relationships.set(key, existing);
    }

    return {
      ...profile,
      zoneRelationships: [...relationships.values()].sort((a, b) => b.weight - a.weight).slice(0, 24),
    };
  },
};

function classifyRelationship(from: string, to: string): ZoneRelationship["kind"] {
  const pair = `${from} ${to}`.toLowerCase();
  if (/test|fixture/.test(from.toLowerCase())) return "tests";
  if (/api|routes|server|cli|cmd/.test(from.toLowerCase())) return "orchestrates";
  if (/scripts|tools|docs/.test(from.toLowerCase())) return "supports";
  if (/db|auth|services|config|src|lib|packages/.test(pair)) return "depends-on";
  return "unknown";
}
