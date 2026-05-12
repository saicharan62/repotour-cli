import type { Analyzer, TimelineSignal } from "../types.js";
import { topLevelZone } from "../utils/paths.js";

export const timelineAnalyzer: Analyzer = {
  name: "timeline",
  analyze(profile) {
    const byZone = new Map<string, { commits: number; score: number; files: number }>();
    for (const file of profile.churnHotspots) {
      const zone = topLevelZone(file.path);
      const current = byZone.get(zone) ?? { commits: 0, score: 0, files: 0 };
      current.commits += file.commits;
      current.score += file.score;
      current.files += 1;
      byZone.set(zone, current);
    }

    const timelineSignals: TimelineSignal[] = [...byZone.entries()]
      .map(([path, stats]) => ({
        path,
        kind: stats.score >= 50 ? "rapidly-evolving" : "recently-active",
        score: Math.round(stats.score),
        summary: `${stats.files} recently changed files across ${stats.commits} commits.`,
      }) satisfies TimelineSignal)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return { ...profile, timelineSignals };
  },
};
