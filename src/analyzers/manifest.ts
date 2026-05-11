import fs from "node:fs/promises";
import type { Analyzer, ManifestInfo, RepoFile } from "../types.js";

export const manifestAnalyzer: Analyzer = {
  name: "manifest",
  async analyze(profile, context) {
    const manifests = await Promise.all(context.files.filter(isManifest).map(parseManifest));
    return { ...profile, manifests: manifests.filter(Boolean) as ManifestInfo[] };
  },
};

function isManifest(file: RepoFile): boolean {
  const name = file.path.split("/").pop() ?? file.path;
  return [
    "package.json",
    "Cargo.toml",
    "pyproject.toml",
    "requirements.txt",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Dockerfile",
    "docker-compose.yml",
    "compose.yml",
  ].includes(name);
}

async function parseManifest(file: RepoFile): Promise<ManifestInfo | undefined> {
  const content = await fs.readFile(file.absolutePath, "utf8");
  const name = file.path.split("/").pop() ?? file.path;
  if (name === "package.json") return parsePackageJson(file.path, content);
  if (name === "Cargo.toml") return parseCargo(file.path, content);
  if (name === "go.mod") return parseGoMod(file.path, content);
  if (name === "requirements.txt") {
    return {
      path: file.path,
      type: "requirements.txt",
      dependencies: content.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).slice(0, 30),
      notes: ["Python dependency list"],
    };
  }
  if (name === "pyproject.toml") return parsePyproject(file.path, content);
  if (name === "Dockerfile") return { path: file.path, type: "Dockerfile", notes: ["Container build entry"] };
  if (file.path.includes("compose")) return { path: file.path, type: "compose", notes: ["Multi-service container orchestration"] };
  return { path: file.path, type: "other", notes: [] };
}

function parsePackageJson(filePath: string, content: string): ManifestInfo {
  const pkg = JSON.parse(content) as {
    name?: string;
    version?: string;
    main?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const dependencies = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).sort();
  return withOptionalManifestFields({
    path: filePath,
    type: "package.json",
    dependencies,
    notes: [pkg.main ? `main: ${pkg.main}` : "", pkg.scripts?.start ? "start script present" : ""].filter(Boolean),
  }, { name: pkg.name, version: pkg.version, scripts: pkg.scripts });
}

function parseCargo(filePath: string, content: string): ManifestInfo {
  return withOptionalManifestFields({
    path: filePath,
    type: "Cargo.toml",
    dependencies: collectTomlSectionKeys(content, "dependencies"),
    notes: content.includes("[[bin]]") ? ["Explicit Cargo binaries"] : ["Rust package manifest"],
  }, { name: matchTomlValue(content, "name"), version: matchTomlValue(content, "version") });
}

function parseGoMod(filePath: string, content: string): ManifestInfo {
  return withOptionalManifestFields({
    path: filePath,
    type: "go.mod",
    dependencies: [...content.matchAll(/^\s*([a-zA-Z0-9_.\-\/]+)\s+v\d/mg)].map((match) => match[1]).filter(Boolean) as string[],
    notes: ["Go module manifest"],
  }, { name: content.match(/^module\s+(.+)$/m)?.[1] });
}

function parsePyproject(filePath: string, content: string): ManifestInfo {
  return withOptionalManifestFields({
    path: filePath,
    type: "pyproject.toml",
    dependencies: collectTomlArray(content, "dependencies"),
    notes: ["Python project metadata"],
  }, { name: matchTomlValue(content, "name"), version: matchTomlValue(content, "version") });
}

function withOptionalManifestFields(
  base: ManifestInfo,
  optional: { name?: string | undefined; version?: string | undefined; scripts?: Record<string, string> | undefined },
): ManifestInfo {
  return {
    ...base,
    ...(optional.name ? { name: optional.name } : {}),
    ...(optional.version ? { version: optional.version } : {}),
    ...(optional.scripts ? { scripts: optional.scripts } : {}),
  };
}

function matchTomlValue(content: string, key: string): string | undefined {
  return content.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']`, "m"))?.[1];
}

function collectTomlSectionKeys(content: string, section: string): string[] {
  const sectionMatch = content.match(new RegExp(`\\[${section}\\]\\n([\\s\\S]*?)(?:\\n\\[|$)`));
  return sectionMatch?.[1]?.split("\n").map((line) => line.match(/^([A-Za-z0-9_.-]+)\s*=/)?.[1]).filter(Boolean) as string[] ?? [];
}

function collectTomlArray(content: string, key: string): string[] {
  const match = content.match(new RegExp(`${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  return match?.[1]?.split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean) ?? [];
}
