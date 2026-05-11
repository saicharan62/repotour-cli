import fs from "node:fs/promises";
import path from "node:path";
import type { Analyzer, EntryPoint, ManifestInfo, RepoFile } from "../types.js";
import { basenameWithoutExtension, lowSignalPenalty, rootProximity } from "../utils/paths.js";
import { confidenceFromScore, scoreSignals, signal, topSignals } from "../utils/signals.js";

const ENTRY_BASENAMES = new Set(["main", "index", "app", "server"]);
const EXECUTABLE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs"]);

export const entrypointsAnalyzer: Analyzer = {
  name: "entrypoints",
  async analyze(profile, context) {
    const entries: EntryPoint[] = [];
    entries.push(...fromManifests(profile.manifests));
    entries.push(...fromConventions(context.files));
    entries.push(...(await fromCargoBins(context.files)));

    return { ...profile, entryPoints: dedupeEntries(entries).slice(0, 18) };
  },
};

function fromManifests(manifests: ManifestInfo[]): EntryPoint[] {
  const entries: EntryPoint[] = [];
  for (const manifest of manifests) {
    if (manifest.type === "package.json") {
      const manifestDir = path.posix.dirname(manifest.path) === "." ? "" : `${path.posix.dirname(manifest.path)}/`;
      const mainNote = manifest.notes.find((note) => note.startsWith("main: "));
      if (mainNote) {
        const entryPath = `${manifestDir}${mainNote.replace("main: ", "")}`;
        entries.push({
          path: entryPath,
          kind: "manifest",
          ...scoreEntry(entryPath, [signal("declared package.json main entry", 42)]),
          reason: "Declared package.json main entry",
        });
      }
      for (const scriptName of ["dev", "start", "serve"]) {
        const command = manifest.scripts?.[scriptName];
        if (command) {
          const scriptTarget = command.match(/\b(src\/[^\s]+\.(?:ts|tsx|js|mjs|cjs))\b/)?.[1];
          if (scriptTarget) {
            const entryPath = `${manifestDir}${scriptTarget}`;
            entries.push({
              path: entryPath,
              kind: "script",
              command: `npm run ${scriptName}`,
              ...scoreEntry(entryPath, [signal(`target of package.json ${scriptName} script`, scriptName === "start" ? 46 : 36)]),
              reason: `Target of package.json ${scriptName} script`,
            });
          }
          if (manifest.path === "package.json") {
            entries.push({
              path: manifest.path,
              kind: "script",
              command: `npm run ${scriptName}`,
              ...scoreEntry(manifest.path, [signal(`package.json ${scriptName} script`, scriptName === "start" ? 32 : 24)]),
              reason: `package.json ${scriptName} script`,
            });
          }
        }
      }
    }
  }
  return entries;
}

function fromConventions(files: RepoFile[]): EntryPoint[] {
  return files
    .filter((file) => EXECUTABLE_EXTENSIONS.has(file.extension))
    .filter((file) => {
      const basename = file.path.split("/").pop()?.replace(/\.[^.]+$/, "");
      if (!basename) return false;
      if (file.path.startsWith("cmd/")) return true;
      if (basename === "index") return file.path.split("/").length <= 2;
      return ENTRY_BASENAMES.has(basename);
    })
    .map((file) => {
      const convention = scoreConvention(file);
      return {
        path: file.path,
        kind: file.path.startsWith("cmd/") ? "directory" : "convention",
        ...scoreEntry(file.path, [signal(convention.label, convention.weight)]),
        reason: file.path.startsWith("cmd/") ? "Go-style cmd directory" : "Common application entry filename",
      };
    });
}

async function fromCargoBins(files: RepoFile[]): Promise<EntryPoint[]> {
  const cargo = files.find((file) => file.path === "Cargo.toml");
  if (!cargo) return [];
  const content = await fs.readFile(cargo.absolutePath, "utf8");
  return [...content.matchAll(/path\s*=\s*["']([^"']+)["']/g)].map((match) => ({
    path: match[1] ?? "Cargo.toml",
    kind: "binary",
    ...scoreEntry(match[1] ?? "Cargo.toml", [signal("declared Cargo binary target", 44)]),
    reason: "Declared Cargo binary target",
  }));
}

function scoreConvention(file: RepoFile): { label: string; weight: number } {
  if (file.path === "src/main.ts" || file.path === "src/index.ts" || file.path === "main.go" || file.path === "main.py") {
    return { label: "canonical root runtime filename", weight: 34 };
  }
  if (file.path.startsWith("src/") || file.path.startsWith("cmd/")) return { label: "common runtime entry filename", weight: 24 };
  return { label: "entry-like filename", weight: 14 };
}

function dedupeEntries(entries: EntryPoint[]): EntryPoint[] {
  const seen = new Map<string, EntryPoint>();
  for (const entry of entries) {
    const key = entry.path;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, entry);
      continue;
    }
    const mergedSignals = topSignals([...existing.signals, ...entry.signals], 6);
    const mergedScore = Math.max(existing.score, entry.score, scoreSignals(mergedSignals));
    const merged: EntryPoint = {
      ...existing,
      kind: existing.kind === "convention" ? entry.kind : existing.kind,
      reason: existing.score >= entry.score ? existing.reason : entry.reason,
      signals: mergedSignals,
      score: mergedScore,
      confidence: confidenceFromScore(mergedScore),
    };
    const command = existing.command ?? entry.command;
    seen.set(key, command ? { ...merged, command } : merged);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score);
}

function scoreEntry(filePath: string, signals: ReturnType<typeof signal>[]): Pick<EntryPoint, "confidence" | "score" | "signals"> {
  const allSignals = [
    ...signals,
    signal("root proximity", rootProximity(filePath)),
    signal("low-signal path penalty", lowSignalPenalty(filePath)),
    signal(`entry filename: ${basenameWithoutExtension(filePath)}`, entryNameWeight(filePath)),
  ].filter((item) => item.weight !== 0);
  const score = scoreSignals(allSignals);
  return { score, confidence: confidenceFromScore(score), signals: topSignals(allSignals) };
}

function entryNameWeight(filePath: string): number {
  const basename = basenameWithoutExtension(filePath);
  if (["main", "server", "app"].includes(basename)) return 16;
  if (basename === "cli") return 14;
  if (basename === "index") return 8;
  return 0;
}
