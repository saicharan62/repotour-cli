import { describe, expect, it } from "vitest";
import { architectureGraphAnalyzer } from "../src/analyzers/architecture-graph.js";
import { executionFlowAnalyzer } from "../src/analyzers/execution-flow.js";
import { zoneRelationshipsAnalyzer } from "../src/analyzers/zone-relationships.js";
import { createEmptyProfile, createRepoContext } from "../src/profile.js";
import type { RepoFile, RepoProfile } from "../src/types.js";

describe("v3 exploration model", () => {
  it("builds a deterministic graph from zones, entrypoints, important files, and relationships", () => {
    const context = createRepoContext(process.cwd(), [file("src/server.ts"), file("src/routes.ts")]);
    const base: RepoProfile = {
      ...createEmptyProfile(context),
      repoZones: [
        {
          path: "src/",
          kind: "runtime/core",
          label: "src",
          summary: "Runtime code.",
          importance: 80,
          confidence: "high",
          files: 2,
          signals: [{ label: "runtime path", weight: 20 }],
        },
      ],
      entryPoints: [
        {
          path: "src/server.ts",
          kind: "script",
          confidence: "high",
          score: 90,
          signals: [{ label: "start script target", weight: 70 }],
          reason: "Target of start script",
        },
      ],
      importantFiles: [
        {
          path: "src/routes.ts",
          reason: "Runtime dependency",
          score: 70,
          signals: [{ label: "imported by entrypoint", weight: 30 }],
        },
      ],
      importGraph: [{ from: "src/server.ts", to: "src/routes.ts", kind: "static" }],
    };

    const withRelationships = zoneRelationshipsAnalyzer.analyze(base, context) as RepoProfile;
    const result = architectureGraphAnalyzer.analyze(withRelationships, context) as RepoProfile;

    expect(result.architectureGraph.nodes.some((node) => node.path === "src/server.ts" && node.kind === "entrypoint")).toBe(true);
    expect(result.architectureGraph.nodes.some((node) => node.path === "src/")).toBe(true);
    expect(result.architectureGraph.edges.some((edge) => edge.kind === "contains" || edge.kind === "entrypoint")).toBe(true);
  });

  it("traces execution flow from an entrypoint through sampled imports", () => {
    const context = createRepoContext(process.cwd(), []);
    const profile: RepoProfile = {
      ...createEmptyProfile(context),
      entryPoints: [
        {
          path: "src/cli.ts",
          kind: "script",
          confidence: "high",
          score: 92,
          signals: [{ label: "target of dev script", weight: 70 }],
          reason: "Target of dev script",
        },
      ],
      importGraph: [
        { from: "src/cli.ts", to: "src/analyzers/index.ts", kind: "static" },
        { from: "src/analyzers/index.ts", to: "src/profile.ts", kind: "static" },
      ],
    };

    const result = executionFlowAnalyzer.analyze(profile, context) as RepoProfile;

    expect(result.executionFlows[0]?.entrypoint).toBe("src/cli.ts");
    expect(result.executionFlows[0]?.steps.map((step) => step.path)).toContain("src/analyzers/index.ts");
  });
});

function file(path: string): RepoFile {
  return {
    path,
    absolutePath: path,
    extension: `.${path.split(".").pop() ?? ""}`,
    sizeBytes: 100,
  };
}
