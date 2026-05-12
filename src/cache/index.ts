import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { RepoProfile } from "../types.js";

export type CachePaths = {
  root: string;
  repositories: string;
  profiles: string;
};

export function getCachePaths(): CachePaths {
  const root = path.join(os.homedir(), ".repotour", "cache");
  return {
    root,
    repositories: path.join(root, "repositories"),
    profiles: path.join(root, "profiles"),
  };
}

export async function ensureCache(): Promise<CachePaths> {
  const paths = getCachePaths();
  await Promise.all([
    fs.mkdir(paths.repositories, { recursive: true }),
    fs.mkdir(paths.profiles, { recursive: true }),
  ]);
  return paths;
}

export function cacheKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/[^a-z0-9_.-]+/g, "__");
}

export async function writeCachedProfile(key: string, profile: RepoProfile): Promise<string> {
  const paths = await ensureCache();
  const filePath = path.join(paths.profiles, `${cacheKey(key)}.json`);
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf8");
  return filePath;
}

export function cachedRepositoryPath(key: string): string {
  return path.join(getCachePaths().repositories, cacheKey(key));
}
