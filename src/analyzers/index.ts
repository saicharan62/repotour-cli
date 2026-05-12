import type { Analyzer, RepoContext, RepoProfile } from "../types.js";
import { architectureGraphAnalyzer } from "./architecture-graph.js";
import { architectureAnalyzer } from "./architecture.js";
import { churnAnalyzer } from "./churn.js";
import { entrypointsAnalyzer } from "./entrypoints.js";
import { entrypointScoringAnalyzer } from "./entrypoint-scoring.js";
import { executionFlowAnalyzer } from "./execution-flow.js";
import { importanceAnalyzer } from "./importance.js";
import { createImportsAnalyzer } from "./imports.js";
import { languageAnalyzer } from "./language.js";
import { manifestAnalyzer } from "./manifest.js";
import { ignoreGuidanceAnalyzer } from "./noise.js";
import { packageMapAnalyzer } from "./package-map.js";
import { readingPathAnalyzer } from "./reading-path.js";
import { readmeAnalyzer } from "./readme.js";
import { timelineAnalyzer } from "./timeline.js";
import { zoneRelationshipsAnalyzer } from "./zone-relationships.js";
import { zonesAnalyzer } from "./zones.js";

export function createAnalyzerPipeline(options: { maxImportFiles?: number } = {}): Analyzer[] {
  return [
    manifestAnalyzer,
    languageAnalyzer,
    entrypointsAnalyzer,
    createImportsAnalyzer(options.maxImportFiles),
    churnAnalyzer,
    entrypointScoringAnalyzer,
    executionFlowAnalyzer,
    readmeAnalyzer,
    zonesAnalyzer,
    zoneRelationshipsAnalyzer,
    packageMapAnalyzer,
    timelineAnalyzer,
    ignoreGuidanceAnalyzer,
    architectureAnalyzer,
    importanceAnalyzer,
    readingPathAnalyzer,
    architectureGraphAnalyzer,
    architectureSummaryAnalyzer,
  ];
}

export async function runAnalyzers(profile: RepoProfile, context: RepoContext, analyzers: Analyzer[]): Promise<RepoProfile> {
  let current = profile;
  for (const analyzer of analyzers) {
    try {
      current = await analyzer.analyze(current, context);
    } catch (error) {
      current = {
        ...current,
        warnings: [
          ...current.warnings,
          { source: analyzer.name, message: error instanceof Error ? error.message : String(error) },
        ],
      };
    }
  }
  return current;
}

const architectureSummaryAnalyzer: Analyzer = {
  name: "architecture-summary",
  analyze(profile) {
    const frameworks = profile.frameworks.map((framework) => framework.name).join(", ") || "no dominant framework detected";
    const entries = profile.entryPoints.slice(0, 3).map((entry) => entry.path).join(", ") || "no obvious entrypoint";
    const style = profile.architectureStyle ? `${profile.architectureStyle.name} (${profile.architectureStyle.confidence} confidence)` : "unclassified architecture style";
    return {
      ...profile,
      architectureSummary: `${profile.repoName} looks primarily like a ${profile.primaryLanguage} repository with ${frameworks}. Detected style: ${style}. Likely execution starts around ${entries}.`,
    };
  },
};
