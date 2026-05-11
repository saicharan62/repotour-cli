export type OutputFormat = "markdown" | "html";

export type RepoProfile = {
  repoName: string;
  rootPath: string;
  generatedAt: string;
  primaryLanguage: LanguageName | "Unknown";
  languages: LanguageStats[];
  frameworks: FrameworkDetection[];
  entryPoints: EntryPoint[];
  manifests: ManifestInfo[];
  importGraph: ImportEdge[];
  churnHotspots: ChurnFile[];
  readmeSections: ReadmeSection[];
  importantFiles: ImportantFile[];
  repoZones: RepoZone[];
  readingPath: ReadingPathItem[];
  architectureStyle?: ArchitectureStyle;
  architectureSummary?: string;
  warnings: ProfileWarning[];
};

export type RepoContext = {
  rootPath: string;
  repoName: string;
  files: RepoFile[];
};

export type RepoFile = {
  path: string;
  absolutePath: string;
  sizeBytes: number;
  extension: string;
};

export type Analyzer = {
  name: string;
  analyze(profile: RepoProfile, context: RepoContext): Promise<RepoProfile> | RepoProfile;
};

export type LanguageName =
  | "TypeScript"
  | "JavaScript"
  | "Python"
  | "Go"
  | "Rust"
  | "Java"
  | "Kotlin"
  | "C#"
  | "C++"
  | "C"
  | "Ruby"
  | "PHP"
  | "Swift"
  | "Shell"
  | "Markdown"
  | "JSON"
  | "YAML"
  | "Other";

export type LanguageStats = {
  language: LanguageName;
  files: number;
  lines: number;
  weight: number;
};

export type FrameworkDetection = {
  name: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
};

export type EntryPoint = {
  path: string;
  kind: "manifest" | "convention" | "script" | "binary" | "directory";
  command?: string;
  confidence: "high" | "medium" | "low";
  score: number;
  signals: ScoreSignal[];
  reason: string;
};

export type ScoreSignal = {
  label: string;
  weight: number;
};

export type ManifestInfo = {
  path: string;
  type:
    | "package.json"
    | "Cargo.toml"
    | "pyproject.toml"
    | "requirements.txt"
    | "go.mod"
    | "pom.xml"
    | "build.gradle"
    | "Dockerfile"
    | "compose"
    | "other";
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: string[];
  notes: string[];
};

export type ImportEdge = {
  from: string;
  to: string;
  kind: "static" | "dynamic" | "package";
};

export type ChurnFile = {
  path: string;
  commits: number;
  additions: number;
  deletions: number;
  lastTouched?: string;
  score: number;
};

export type ReadmeSection = {
  title: string;
  level: number;
  content: string;
  category: "setup" | "architecture" | "development" | "contributing" | "deployment" | "overview";
};

export type ImportantFile = {
  path: string;
  reason: string;
  score: number;
  signals: ScoreSignal[];
};

export type RepoZone = {
  path: string;
  kind:
    | "runtime/core"
    | "compiler"
    | "renderer"
    | "api"
    | "auth"
    | "db"
    | "cli"
    | "tests"
    | "fixtures"
    | "examples"
    | "tooling"
    | "scripts"
    | "docs"
    | "package"
    | "support"
    | "unknown";
  label: string;
  summary: string;
  importance: number;
  confidence: "high" | "medium" | "low";
  files: number;
  signals: ScoreSignal[];
};

export type ReadingPathItem = {
  path: string;
  title: string;
  reason: string;
  score: number;
};

export type ArchitectureStyle = {
  name: string;
  confidence: "high" | "medium" | "low";
  signals: ScoreSignal[];
};

export type ProfileWarning = {
  source: string;
  message: string;
};

export type CliOptions = {
  html?: boolean;
  markdown?: boolean;
  output?: string;
  maxImportFiles?: string;
};
