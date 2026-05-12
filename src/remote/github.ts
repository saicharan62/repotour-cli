import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";
import { cachedRepositoryPath, ensureCache } from "../cache/index.js";

const execFileAsync = promisify(execFile);

export type GitHubRepoRef = {
  owner: string;
  repo: string;
  url: string;
  key: string;
};

export function parseGitHubInput(input: string): GitHubRepoRef | undefined {
  const shorthand = input.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shorthand) return fromParts(shorthand[1] ?? "", shorthand[2] ?? "");

  try {
    const url = new URL(input);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return undefined;
    const [owner, repoRaw] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repoRaw) return undefined;
    return fromParts(owner, repoRaw.replace(/\.git$/, ""));
  } catch {
    return undefined;
  }
}

export async function ensureGitHubRepository(input: string): Promise<string | undefined> {
  const ref = parseGitHubInput(input);
  if (!ref) return undefined;
  await ensureCache();
  const destination = cachedRepositoryPath(ref.key);

  if (await exists(destination)) {
    await execFileAsync("git", ["fetch", "--depth=1", "origin", "HEAD"], { cwd: destination });
    return destination;
  }

  await execFileAsync("git", ["clone", "--depth=1", ref.url, destination], { maxBuffer: 10 * 1024 * 1024 });
  return destination;
}

function fromParts(owner: string, repo: string): GitHubRepoRef {
  const key = `${owner}/${repo}`;
  return {
    owner,
    repo,
    key,
    url: `https://github.com/${owner}/${repo}.git`,
  };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
