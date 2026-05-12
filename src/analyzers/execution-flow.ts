import type { Analyzer, ExecutionFlow, ExecutionFlowStep, ImportEdge } from "../types.js";
import { isLowSignalPath } from "../utils/paths.js";
import { confidenceFromScore, signal, topSignals } from "../utils/signals.js";

export const executionFlowAnalyzer: Analyzer = {
  name: "execution-flow",
  analyze(profile) {
    const flows = profile.entryPoints.slice(0, 4).map((entry): ExecutionFlow => {
      const steps = trace(entry.path, profile.importGraph);
      const score = Math.max(entry.score, Math.round(steps.reduce((total, step) => total + Math.max(0, step.signals[0]?.weight ?? 0), 0) / Math.max(1, steps.length)));
      return {
        entrypoint: entry.path,
        confidence: confidenceFromScore(score),
        score,
        steps,
      };
    });

    return { ...profile, executionFlows: flows.filter((flow) => flow.steps.length > 0) };
  },
};

function trace(entrypoint: string, edges: ImportEdge[]): ExecutionFlowStep[] {
  const byFrom = new Map<string, ImportEdge[]>();
  for (const edge of edges) {
    if (edge.kind !== "static") continue;
    const current = byFrom.get(edge.from) ?? [];
    current.push(edge);
    byFrom.set(edge.from, current);
  }

  const steps: ExecutionFlowStep[] = [
    {
      path: entrypoint,
      role: "entrypoint",
      reason: "Highest-ranked runtime start candidate.",
      depth: 0,
      signals: [signal("selected entrypoint", 40)],
    },
  ];
  const seen = new Set([entrypoint]);
  const queue: Array<{ path: string; depth: number }> = [{ path: entrypoint, depth: 0 }];

  while (queue.length && steps.length < 18) {
    const current = queue.shift();
    if (!current || current.depth >= 3) continue;
    const nextEdges = (byFrom.get(current.path) ?? [])
      .filter((edge) => !seen.has(edge.to))
      .sort((a, b) => roleWeight(b.to) - roleWeight(a.to))
      .slice(0, current.depth === 0 ? 5 : 3);

    for (const edge of nextEdges) {
      seen.add(edge.to);
      const role = classifyStep(edge.to);
      const signals = topSignals([
        signal(`imported by ${current.path}`, 24),
        signal(`${role} naming signal`, roleWeight(edge.to)),
        isLowSignalPath(edge.to) ? signal("low-signal path penalty", -22) : signal("runtime path", 8),
      ]);
      steps.push({
        path: edge.to,
        role,
        reason: reasonFor(role, current.path),
        depth: current.depth + 1,
        signals,
      });
      if (!edge.to.includes("node:") && !edge.to.startsWith("@") && !/^[a-z0-9_-]+$/i.test(edge.to)) {
        queue.push({ path: edge.to, depth: current.depth + 1 });
      }
    }
  }

  return steps;
}

function classifyStep(path: string): ExecutionFlowStep["role"] {
  const lower = path.toLowerCase();
  if (/^node:|^[a-z@]/.test(path) && !path.includes("/")) return "external-package";
  if (/cli|main|server|app|index/.test(lower)) return "orchestrator";
  if (/routes?|controllers?|services?|db|auth|config|render|runtime|core/.test(lower)) return "runtime-module";
  return "unknown";
}

function roleWeight(path: string): number {
  const role = classifyStep(path);
  if (role === "orchestrator") return 18;
  if (role === "runtime-module") return 14;
  if (role === "external-package") return 4;
  return 6;
}

function reasonFor(role: ExecutionFlowStep["role"], importer: string): string {
  if (role === "orchestrator") return `Likely orchestration module imported by ${importer}.`;
  if (role === "runtime-module") return `Runtime dependency reached from ${importer}.`;
  if (role === "external-package") return `External runtime dependency used by ${importer}.`;
  return `Imported from ${importer}.`;
}
