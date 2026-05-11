import { readRecentNumstat } from "../walker/git.js";
import type { Analyzer, ChurnFile } from "../types.js";

export const churnAnalyzer: Analyzer = {
  name: "churn",
  async analyze(profile, context) {
    const rows = await readRecentNumstat(context.rootPath);
    const byFile = new Map<string, ChurnFile & { commitsSeen: Set<string> }>();

    for (const row of rows) {
      const current = byFile.get(row.path) ?? {
        path: row.path,
        commits: 0,
        additions: 0,
        deletions: 0,
        score: 0,
        commitsSeen: new Set<string>(),
      };
      current.additions += row.additions;
      current.deletions += row.deletions;
      current.lastTouched = maxDate(current.lastTouched, row.date);
      current.commitsSeen.add(row.commit);
      byFile.set(row.path, current);
    }

    const churnHotspots = [...byFile.values()]
      .map(({ commitsSeen, ...file }) => ({
        ...file,
        commits: commitsSeen.size,
        score: commitsSeen.size * 4 + Math.log10(file.additions + file.deletions + 1) * 6,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return { ...profile, churnHotspots };
  },
};

function maxDate(left: string | undefined, right: string): string {
  if (!left) return right;
  return left > right ? left : right;
}
