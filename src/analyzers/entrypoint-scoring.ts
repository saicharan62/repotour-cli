import type { Analyzer, EntryPoint } from "../types.js";
import { incomingInternalCount, outgoingInternalCount } from "../utils/graph.js";
import { lowSignalPenalty, rootProximity } from "../utils/paths.js";
import { confidenceFromScore, scoreSignals, signal, topSignals } from "../utils/signals.js";

export const entrypointScoringAnalyzer: Analyzer = {
  name: "entrypoint-scoring",
  analyze(profile) {
    const churnByPath = new Map(profile.churnHotspots.map((file) => [file.path, file]));
    const rescored = profile.entryPoints.map((entry): EntryPoint => {
      const fanout = outgoingInternalCount(profile.importGraph, entry.path);
      const fanin = incomingInternalCount(profile.importGraph, entry.path);
      const churn = churnByPath.get(entry.path);
      const signals = topSignals([
        ...entry.signals,
        fanout ? signal(`imports ${fanout} project files`, Math.min(18, fanout * 4)) : signal("no sampled project imports", -5),
        fanin ? signal(`imported by ${fanin} sampled files`, Math.min(14, fanin * 3)) : signal("not imported by sampled files", 0),
        churn ? signal(`recently changed in ${churn.commits} commits`, Math.min(14, churn.commits * 3)) : signal("no recent churn signal", 0),
        signal("root proximity", rootProximity(entry.path)),
        signal("low-signal path penalty", lowSignalPenalty(entry.path)),
      ].filter((item) => item.weight !== 0), 7);
      const score = scoreSignals(signals);
      return { ...entry, signals, score, confidence: confidenceFromScore(score) };
    });

    return { ...profile, entryPoints: rescored.filter((entry) => entry.score >= 35).sort((a, b) => b.score - a.score).slice(0, 10) };
  },
};
