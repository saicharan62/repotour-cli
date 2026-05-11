import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { Ignore } from "ignore";
import type { RepoFile } from "../types.js";

const require = createRequire(import.meta.url);
const ignore = require("ignore") as typeof import("ignore").default;

const ALWAYS_IGNORED = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "vendor",
  ".next",
  ".turbo",
  "target",
  "__pycache__",
  ".venv",
]);

export async function walkRepository(rootPath: string): Promise<RepoFile[]> {
  const resolvedRoot = path.resolve(rootPath);
  const matcher = ignore().add(await readGitignore(resolvedRoot));
  const files: RepoFile[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = path.join(directory, entry.name);
        const relativePath = toPosix(path.relative(resolvedRoot, absolutePath));
        if (!relativePath || shouldSkip(relativePath, entry.name, matcher)) return;

        if (entry.isDirectory()) {
          await visit(absolutePath);
          return;
        }

        if (!entry.isFile()) return;

        const stat = await fs.stat(absolutePath);
        files.push({
          path: relativePath,
          absolutePath,
          sizeBytes: stat.size,
          extension: path.extname(entry.name).toLowerCase(),
        });
      }),
    );
  }

  await visit(resolvedRoot);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function readGitignore(rootPath: string): Promise<string> {
  try {
    return await fs.readFile(path.join(rootPath, ".gitignore"), "utf8");
  } catch {
    return "";
  }
}

function shouldSkip(relativePath: string, name: string, matcher: Ignore): boolean {
  if (ALWAYS_IGNORED.has(name)) return true;
  return matcher.ignores(relativePath);
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
