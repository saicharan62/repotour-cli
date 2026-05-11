import fs from "node:fs/promises";
import path from "node:path";
import type { Analyzer, ImportEdge, RepoFile } from "../types.js";

const IMPORTABLE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs"]);

export function createImportsAnalyzer(maxFiles = 80): Analyzer {
  return {
    name: "imports",
    async analyze(profile, context) {
      const candidates = chooseImportCandidates(context.files, profile.entryPoints.map((entry) => entry.path), maxFiles);
      const edges = (await Promise.all(candidates.map((file) => parseImports(file, context.files)))).flat();
      return { ...profile, importGraph: edges.slice(0, 200) };
    },
  };
}

function chooseImportCandidates(files: RepoFile[], entryPaths: string[], maxFiles: number): RepoFile[] {
  const byPath = new Map(files.map((file) => [file.path, file]));
  const prioritized = entryPaths.map((entry) => byPath.get(entry)).filter(Boolean) as RepoFile[];
  const rest = files.filter((file) => IMPORTABLE_EXTENSIONS.has(file.extension) && !entryPaths.includes(file.path));
  return [...prioritized, ...rest].slice(0, maxFiles);
}

async function parseImports(file: RepoFile, allFiles: RepoFile[]): Promise<ImportEdge[]> {
  if (!IMPORTABLE_EXTENSIONS.has(file.extension) || file.sizeBytes > 300_000) return [];
  const content = await fs.readFile(file.absolutePath, "utf8");
  const imports = extractImports(content, file.extension);
  return imports.map((target) => ({
    from: file.path,
    to: resolveImport(file.path, target, allFiles),
    kind: target.startsWith(".") ? "static" : "package",
  }));
}

function extractImports(content: string, extension: string): string[] {
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(extension)) {
    return [
      ...content.matchAll(/import\s+(?:.+?\s+from\s+)?["']([^"']+)["']/g),
      ...content.matchAll(/require\(["']([^"']+)["']\)/g),
    ].map((match) => match[1]).filter(Boolean) as string[];
  }
  if (extension === ".py") {
    return [
      ...content.matchAll(/^\s*from\s+([A-Za-z0-9_.]+)\s+import\s+/gm),
      ...content.matchAll(/^\s*import\s+([A-Za-z0-9_.]+)/gm),
    ].map((match) => match[1]).filter(Boolean) as string[];
  }
  if (extension === ".go") {
    return [...content.matchAll(/"([^"]+)"/g)].flatMap((match) => {
      const value = match[1];
      return value && value.includes("/") ? [value] : [];
    });
  }
  if (extension === ".rs") {
    return [...content.matchAll(/use\s+([A-Za-z0-9_:]+)/g)].map((match) => match[1]).filter(Boolean) as string[];
  }
  return [];
}

function resolveImport(fromPath: string, target: string, allFiles: RepoFile[]): string {
  if (!target.startsWith(".")) return target;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), target));
  const withoutJsExtension = base.replace(/\.(js|mjs|cjs)$/, "");
  const match = allFiles.find((file) =>
    file.path === base ||
    file.path === `${withoutJsExtension}.ts` ||
    file.path === `${withoutJsExtension}.tsx` ||
    file.path === `${withoutJsExtension}.js` ||
    file.path === `${withoutJsExtension}.jsx` ||
    file.path === `${base}/index.ts` ||
    file.path === `${base}/index.js`
  );
  return match?.path ?? target;
}
