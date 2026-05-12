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
  architectureGraph: ArchitectureGraph;
  executionFlows: ExecutionFlow[];
  zoneRelationships: ZoneRelationship[];
  packageMap: PackageBoundary[];
  timelineSignals: TimelineSignal[];
  ignoreGuidance: IgnoreGuidance[];
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

export type ArchitectureGraph = {
  nodes: ArchitectureGraphNode[];
  edges: ArchitectureGraphEdge[];
};

export type ArchitectureGraphNode = {
  id: string;
  label: string;
  kind: "zone" | "entrypoint" | "module" | "package" | "manifest";
  path: string;
  importance: number;
  role: string;
  lowSignal: boolean;
  signals: ScoreSignal[];
};

export type ArchitectureGraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "imports" | "contains" | "entrypoint" | "package-dependency" | "reads-first";
  weight: number;
  label: string;
};

export type ExecutionFlow = {
  entrypoint: string;
  confidence: "high" | "medium" | "low";
  score: number;
  steps: ExecutionFlowStep[];
};

export type ExecutionFlowStep = {
  path: string;
  role: "entrypoint" | "orchestrator" | "runtime-module" | "external-package" | "unknown";
  reason: string;
  depth: number;
  signals: ScoreSignal[];
};

export type ZoneRelationship = {
  from: string;
  to: string;
  kind: "depends-on" | "orchestrates" | "supports" | "tests" | "unknown";
  weight: number;
  evidence: string[];
};

export type PackageBoundary = {
  path: string;
  name: string;
  dependencies: string[];
  internalDependencies: string[];
  centrality: number;
  signals: ScoreSignal[];
};

export type TimelineSignal = {
  path: string;
  kind: "rapidly-evolving" | "stable" | "recently-active";
  score: number;
  summary: string;
};

export type IgnoreGuidance = {
  path: string;
  reason: string;
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
  interactive?: boolean;
  graph?: boolean;
  flow?: boolean;
  focus?: string;
  ignoreLowSignal?: boolean;
  output?: string;
  maxImportFiles?: string;
};
