import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import type { Analyzer, FrameworkDetection, LanguageName, LanguageStats, RepoFile } from "../types.js";

const LANGUAGE_BY_EXTENSION: Record<string, LanguageName> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".cs": "C#",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".c": "C",
  ".rb": "Ruby",
  ".php": "PHP",
  ".swift": "Swift",
  ".sh": "Shell",
  ".md": "Markdown",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
};

const LANGUAGE_WEIGHTS: Partial<Record<LanguageName, number>> = {
  TypeScript: 1.35,
  JavaScript: 1.2,
  Python: 1.2,
  Go: 1.25,
  Rust: 1.25,
  Markdown: 0.25,
  JSON: 0.2,
  YAML: 0.25,
};

export const languageAnalyzer: Analyzer = {
  name: "language",
  async analyze(profile, context) {
    const stats = new Map<LanguageName, LanguageStats>();

    await Promise.all(
      context.files.filter(isTextLike).map(async (file) => {
        const language = LANGUAGE_BY_EXTENSION[file.extension] ?? "Other";
        const lines = await countLines(file.absolutePath);
        const current = stats.get(language) ?? { language, files: 0, lines: 0, weight: 0 };
        current.files += 1;
        current.lines += lines;
        current.weight += lines * (LANGUAGE_WEIGHTS[language] ?? 1);
        stats.set(language, current);
      }),
    );

    const languages = [...stats.values()].sort((a, b) => b.weight - a.weight);
    return {
      ...profile,
      languages,
      primaryLanguage: languages.find((lang) => !["Markdown", "JSON", "YAML"].includes(lang.language))?.language ?? "Unknown",
      frameworks: dedupeFrameworks([...profile.frameworks, ...detectFrameworks(context.files)]),
    };
  },
};

function isTextLike(file: RepoFile): boolean {
  return file.sizeBytes < 750_000 && (file.extension in LANGUAGE_BY_EXTENSION || file.extension === "");
}

async function countLines(filePath: string): Promise<number> {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return contents.split("\n").length;
  } catch {
    return 0;
  }
}

function detectFrameworks(files: RepoFile[]): FrameworkDetection[] {
  const paths = new Set(files.map((file) => file.path));
  const packageJson = files.find((file) => file.path === "package.json");
  const detections: FrameworkDetection[] = [];

  if (packageJson) detections.push(...detectNodeFrameworks(packageJson.absolutePath));
  if (paths.has("next.config.js") || paths.has("next.config.mjs") || paths.has("next.config.ts")) {
    detections.push({ name: "Next.js", confidence: "high", evidence: ["next.config.*"] });
  }
  if (paths.has("manage.py")) {
    detections.push({ name: "Django", confidence: "high", evidence: ["manage.py"] });
  }
  if (files.some((file) => file.path.includes("fastapi") || file.path.endsWith("main.py"))) {
    detections.push({ name: "FastAPI", confidence: "low", evidence: ["Python app naming conventions"] });
  }
  if (paths.has("Cargo.toml")) detections.push({ name: "Rust Cargo", confidence: "high", evidence: ["Cargo.toml"] });
  if (paths.has("go.mod")) detections.push({ name: "Go module", confidence: "high", evidence: ["go.mod"] });
  if (files.some((file) => file.path.startsWith("cmd/") && file.path.endsWith(".go"))) {
    detections.push({ name: "Go CLI/service", confidence: "medium", evidence: ["cmd/*.go"] });
  }

  return dedupeFrameworks(detections);
}

function detectNodeFrameworks(packageJsonPath: string): FrameworkDetection[] {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const has = (name: string) => Object.hasOwn(deps, name);
    return [
      has("next") && { name: "Next.js", confidence: "high", evidence: ["package.json dependency: next"] },
      has("react") && { name: "React", confidence: "high", evidence: ["package.json dependency: react"] },
      has("express") && { name: "Express", confidence: "high", evidence: ["package.json dependency: express"] },
      has("@nestjs/core") && { name: "NestJS", confidence: "high", evidence: ["package.json dependency: @nestjs/core"] },
      has("vite") && { name: "Vite", confidence: "medium", evidence: ["package.json dependency: vite"] },
    ].filter(Boolean) as FrameworkDetection[];
  } catch {
    return [];
  }
}

function dedupeFrameworks(frameworks: FrameworkDetection[]): FrameworkDetection[] {
  const byName = new Map<string, FrameworkDetection>();
  for (const framework of frameworks) {
    const existing = byName.get(framework.name);
    if (!existing || confidenceRank(framework.confidence) > confidenceRank(existing.confidence)) {
      byName.set(framework.name, framework);
    }
  }
  return [...byName.values()].sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence));
}

function confidenceRank(confidence: FrameworkDetection["confidence"]): number {
  return confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
}
