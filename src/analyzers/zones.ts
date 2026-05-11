import type { Analyzer, RepoZone } from "../types.js";
import { computeCentrality } from "../utils/graph.js";
import { isLowSignalPath, topLevelZone } from "../utils/paths.js";
import { confidenceFromScore, scoreSignals, signal, topSignals } from "../utils/signals.js";

export const zonesAnalyzer: Analyzer = {
  name: "zones",
  analyze(profile, context) {
    const centrality = computeCentrality(profile.importGraph);
    const churnByZone = new Map<string, number>();
    for (const churn of profile.churnHotspots) {
      const zone = topLevelZone(churn.path);
      churnByZone.set(zone, (churnByZone.get(zone) ?? 0) + churn.score);
    }

    const byZone = new Map<string, { files: number; fanout: number; fanin: number }>();
    for (const file of context.files) {
      const zone = topLevelZone(file.path);
      const current = byZone.get(zone) ?? { files: 0, fanout: 0, fanin: 0 };
      const fileCentrality = centrality.get(file.path);
      current.files += 1;
      current.fanout += fileCentrality?.fanout ?? 0;
      current.fanin += fileCentrality?.fanin ?? 0;
      byZone.set(zone, current);
    }

    const repoZones = [...byZone.entries()]
      .map(([zonePath, stats]) => buildZone(zonePath, stats, churnByZone.get(zonePath) ?? 0))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 16);

    return { ...profile, repoZones };
  },
};

function buildZone(zonePath: string, stats: { files: number; fanout: number; fanin: number }, churnScore: number): RepoZone {
  const kind = classifyZone(zonePath);
  const signals = topSignals([
    signal(`${stats.files} files`, Math.min(18, Math.log10(stats.files + 1) * 10)),
    stats.fanout ? signal(`imports out of zone sample: ${stats.fanout}`, Math.min(18, stats.fanout * 2)) : signal("low sampled import fanout", 0),
    stats.fanin ? signal(`imported by sampled files: ${stats.fanin}`, Math.min(18, stats.fanin * 2)) : signal("low sampled import fanin", 0),
    churnScore ? signal("recent churn activity", Math.min(16, churnScore / 4)) : signal("no recent churn signal", 0),
    signal(`${kind} naming convention`, zoneKindWeight(kind)),
    isLowSignalPath(zonePath) ? signal("support/fixture path penalty", -28) : signal("runtime path", 8),
  ].filter((item) => item.weight !== 0), 6);
  const importance = scoreSignals(signals);

  return {
    path: zonePath,
    kind,
    label: labelFor(zonePath, kind),
    summary: summarizeZone(zonePath, kind),
    importance,
    confidence: confidenceFromScore(importance),
    files: stats.files,
    signals,
  };
}

function classifyZone(zonePath: string): RepoZone["kind"] {
  const lower = zonePath.toLowerCase();
  if (lower === ".") return "support";
  if (/test|spec|__tests__/.test(lower)) return "tests";
  if (/fixture|snapshot|mock/.test(lower)) return "fixtures";
  if (/example|demo|playground|sandbox/.test(lower)) return "examples";
  if (/docs?|website/.test(lower)) return "docs";
  if (/scripts?/.test(lower)) return "scripts";
  if (/tool|build|config|infra|dev/.test(lower)) return "tooling";
  if (/cli|cmd/.test(lower)) return "cli";
  if (/compiler|parser|transform/.test(lower)) return "compiler";
  if (/render|dom|view|ui/.test(lower)) return "renderer";
  if (/api|routes?|controllers?/.test(lower)) return "api";
  if (/auth|session|identity/.test(lower)) return "auth";
  if (/db|database|models?|schema|migrations?/.test(lower)) return "db";
  if (/packages\/[^/]+\/$/.test(lower)) return "package";
  if (/src|lib|core|runtime|server|app/.test(lower)) return "runtime/core";
  return "unknown";
}

function zoneKindWeight(kind: RepoZone["kind"]): number {
  if (["runtime/core", "compiler", "renderer", "api", "auth", "db", "cli", "package"].includes(kind)) return 18;
  if (["tooling", "scripts"].includes(kind)) return 8;
  if (["tests", "fixtures", "examples", "docs"].includes(kind)) return -8;
  return 0;
}

function labelFor(zonePath: string, kind: RepoZone["kind"]): string {
  if (zonePath === ".") return "Repository root";
  if (kind === "package") return `Package: ${zonePath.replace(/\/$/, "")}`;
  return zonePath.replace(/\/$/, "") || zonePath;
}

function summarizeZone(zonePath: string, kind: RepoZone["kind"]): string {
  const summaries: Record<RepoZone["kind"], string> = {
    "runtime/core": "Likely core runtime or application logic.",
    compiler: "Compiler, parser, or code transformation logic.",
    renderer: "Rendering or UI/runtime integration area.",
    api: "Public API, route, or controller surface.",
    auth: "Authentication or session-related logic.",
    db: "Persistence, schema, model, or migration layer.",
    cli: "Command-line entry and developer-facing execution surface.",
    tests: "Test coverage and validation support.",
    fixtures: "Fixtures, snapshots, or mocks. Usually safe to skim later.",
    examples: "Examples, demos, or playgrounds. Useful after core concepts.",
    tooling: "Build, configuration, or developer automation.",
    scripts: "Repository automation scripts.",
    docs: "Documentation and written project context.",
    package: "Package-level module, likely meaningful in a monorepo.",
    support: "Support files.",
    unknown: "Unclassified repository area.",
  };
  return `${summaries[kind]} Evidence is based on path '${zonePath}'.`;
}
