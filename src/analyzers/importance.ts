import type { Analyzer, ImportantFile } from "../types.js";
import { computeCentrality } from "../utils/graph.js";
import { lowSignalPenalty, rootProximity } from "../utils/paths.js";
import { scoreSignals, signal, topSignals } from "../utils/signals.js";

export const importanceAnalyzer: Analyzer = {
  name: "importance",
  analyze(profile) {
    const scored = new Map<string, ImportantFile>();
    const centrality = computeCentrality(profile.importGraph);
    const churnByPath = new Map(profile.churnHotspots.map((file) => [file.path, file]));

    const add = (path: string, reason: string, baseSignals: ReturnType<typeof signal>[]) => {
      const fileCentrality = centrality.get(path);
      const churn = churnByPath.get(path);
      const signals = topSignals([
        ...baseSignals,
        fileCentrality?.fanout ? signal(`imports ${fileCentrality.fanout} sampled dependencies`, Math.min(20, fileCentrality.fanout * 3)) : signal("low sampled fanout", 0),
        fileCentrality?.fanin ? signal(`imported by ${fileCentrality.fanin} sampled files`, Math.min(20, fileCentrality.fanin * 4)) : signal("low sampled fanin", 0),
        churn ? signal(`recent churn: ${churn.commits} commits`, Math.min(18, churn.commits * 4)) : signal("no recent churn signal", 0),
        signal("root proximity", rootProximity(path)),
        signal("low-signal path penalty", lowSignalPenalty(path)),
      ].filter((item) => item.weight !== 0), 7);
      const candidate = { path, reason, score: scoreSignals(signals), signals };
      const existing = scored.get(path);
      if (!existing || candidate.score > existing.score) scored.set(path, candidate);
    };

    for (const entry of profile.entryPoints) add(entry.path, "Likely execution entrypoint", [signal("entrypoint score", entry.score)]);
    for (const manifest of profile.manifests) add(manifest.path, `${manifest.type} manifest`, [signal("manifest/config file", 42)]);
    for (const churn of profile.churnHotspots.slice(0, 12)) add(churn.path, "Active architectural hotspot", [signal("high recent git churn", Math.min(40, churn.score))]);
    for (const edge of profile.importGraph.slice(0, 120)) add(edge.from, "Participates in sampled import graph", [signal("sampled source module", 18)]);

    return {
      ...profile,
      importantFiles: [...scored.values()]
        .filter((file) => file.score >= 25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 14),
    };
  },
};
