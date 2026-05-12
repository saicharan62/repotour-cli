import path from "node:path";
import { createAnalyzerPipeline, runAnalyzers } from "../analyzers/index.js";
import { writeCachedProfile } from "../cache/index.js";
import { createEmptyProfile, createRepoContext } from "../profile.js";
import { ensureGitHubRepository, parseGitHubInput } from "../remote/github.js";
import type { RepoProfile } from "../types.js";
import { walkRepository } from "../walker/index.js";

export type AnalyzeOptions = {
  maxImportFiles?: number;
  cacheProfile?: boolean;
};

export type AnalyzeResult = {
  profile: RepoProfile;
  rootPath: string;
  source: "local" | "github";
  cachedProfilePath?: string;
};

export async function analyzeRepository(input: string, options: AnalyzeOptions = {}): Promise<AnalyzeResult> {
  const githubRef = parseGitHubInput(input);
  const resolvedRemotePath = githubRef ? await ensureGitHubRepository(input) : undefined;
  const rootPath = resolvedRemotePath ?? path.resolve(input);
  const files = await walkRepository(rootPath);
  const context = createRepoContext(rootPath, files);
  const profile = await runAnalyzers(
    createEmptyProfile(context),
    context,
    createAnalyzerPipeline({ maxImportFiles: options.maxImportFiles ?? 80 }),
  );
  const cachedProfilePath = options.cacheProfile ? await tryWriteCachedProfile(githubRef?.key ?? rootPath, profile) : undefined;

  return {
    profile,
    rootPath,
    source: githubRef ? "github" : "local",
    ...(cachedProfilePath ? { cachedProfilePath } : {}),
  };
}

async function tryWriteCachedProfile(key: string, profile: RepoProfile): Promise<string | undefined> {
  try {
    return await writeCachedProfile(key, profile);
  } catch (error) {
    profile.warnings.push({
      source: "cache",
      message: `Could not write RepoProfile cache: ${error instanceof Error ? error.message : String(error)}`,
    });
    return undefined;
  }
}
