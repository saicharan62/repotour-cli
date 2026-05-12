import path from "node:path";
import type { RepoContext, RepoProfile } from "./types.js";

export function createEmptyProfile(context: RepoContext): RepoProfile {
  return {
    repoName: context.repoName,
    rootPath: context.rootPath,
    generatedAt: new Date().toISOString(),
    primaryLanguage: "Unknown",
    languages: [],
    frameworks: [],
    entryPoints: [],
    manifests: [],
    importGraph: [],
    churnHotspots: [],
    readmeSections: [],
    importantFiles: [],
    repoZones: [],
    readingPath: [],
    architectureGraph: { nodes: [], edges: [] },
    executionFlows: [],
    zoneRelationships: [],
    packageMap: [],
    timelineSignals: [],
    ignoreGuidance: [],
    warnings: [],
  };
}

export function createRepoContext(rootPath: string, files: RepoContext["files"]): RepoContext {
  const resolvedRoot = path.resolve(rootPath);
  return {
    rootPath: resolvedRoot,
    repoName: path.basename(resolvedRoot),
    files,
  };
}
