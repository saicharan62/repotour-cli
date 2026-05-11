const LOW_SIGNAL_SEGMENTS = new Set([
  "__fixtures__",
  "__snapshots__",
  "benchmark",
  "benchmarks",
  "demo",
  "demos",
  "example",
  "examples",
  "fixture",
  "fixtures",
  "mock",
  "mocks",
  "playground",
  "playgrounds",
  "sandbox",
  "test",
  "tests",
]);

const GENERATED_PATTERNS = [/\.min\./, /\.generated\./, /\.gen\./, /(^|\/)generated\//, /(^|\/)snapshots?\//];

export function pathSegments(filePath: string): string[] {
  return filePath.split("/").filter(Boolean);
}

export function rootProximity(filePath: string): number {
  return Math.max(0, 20 - pathSegments(filePath).length * 4);
}

export function isLowSignalPath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return pathSegments(lower).some((segment) => LOW_SIGNAL_SEGMENTS.has(segment)) || GENERATED_PATTERNS.some((pattern) => pattern.test(lower));
}

export function lowSignalPenalty(filePath: string): number {
  if (!isLowSignalPath(filePath)) return 0;
  const lower = filePath.toLowerCase();
  if (lower.includes("fixture") || lower.includes("snapshot") || lower.includes("playground")) return -35;
  if (lower.includes("example") || lower.includes("benchmark")) return -25;
  return -18;
}

export function topLevelZone(filePath: string): string {
  const segments = pathSegments(filePath);
  if (segments.length <= 1) return ".";
  if (segments[0] === "packages" && segments[1]) return `packages/${segments[1]}/`;
  if (segments[0] === "apps" && segments[1]) return `apps/${segments[1]}/`;
  if (segments[0] === "services" && segments[1]) return `services/${segments[1]}/`;
  if (segments[0] === "cmd" && segments[1]) return `cmd/${segments[1]}/`;
  return segments[0] ? `${segments[0]}/` : filePath;
}

export function basenameWithoutExtension(filePath: string): string {
  const name = filePath.split("/").pop() ?? filePath;
  return name.replace(/\.[^.]+$/, "");
}
