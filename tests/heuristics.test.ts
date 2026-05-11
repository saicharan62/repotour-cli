import { describe, expect, it } from "vitest";
import { entrypointScoringAnalyzer } from "../src/analyzers/entrypoint-scoring.js";
import { zonesAnalyzer } from "../src/analyzers/zones.js";
import { createEmptyProfile, createRepoContext } from "../src/profile.js";
import type { RepoFile, RepoProfile } from "../src/types.js";

describe("orientation heuristics", () => {
  it("downranks fixture-like entrypoints below manifest-backed runtime entries", () => {
    const profile: RepoProfile = {
      ...createEmptyProfile(createRepoContext(process.cwd(), [])),
      entryPoints: [
        {
          path: "fixtures/demo/server.ts",
          kind: "convention",
          confidence: "medium",
          score: 55,
          signals: [{ label: "entry-like filename", weight: 55 }],
          reason: "Common application entry filename",
        },
        {
          path: "src/server.ts",
          kind: "script",
          command: "npm run start",
          confidence: "high",
          score: 75,
          signals: [{ label: "target of package.json start script", weight: 75 }],
          reason: "Target of package.json start script",
        },
      ],
      importGraph: [
        { from: "src/server.ts", to: "src/routes.ts", kind: "static" },
        { from: "src/server.ts", to: "src/db.ts", kind: "static" },
      ],
    };

    const result = entrypointScoringAnalyzer.analyze(profile, createRepoContext(process.cwd(), [])) as RepoProfile;

    expect(result.entryPoints[0]?.path).toBe("src/server.ts");
    expect(result.entryPoints[0]?.score).toBeGreaterThan(result.entryPoints[1]?.score ?? 0);
  });

  it("classifies support zones separately from runtime zones", () => {
    const files: RepoFile[] = [
      file("src/server.ts"),
      file("src/routes.ts"),
      file("fixtures/app/server.ts"),
      file("scripts/build.ts"),
    ];
    const context = createRepoContext(process.cwd(), files);
    const profile: RepoProfile = {
      ...createEmptyProfile(context),
      importGraph: [{ from: "src/server.ts", to: "src/routes.ts", kind: "static" }],
    };

    const result = zonesAnalyzer.analyze(profile, context) as RepoProfile;

    expect(result.repoZones.find((zone) => zone.path === "src/")?.kind).toBe("runtime/core");
    expect(result.repoZones.find((zone) => zone.path === "fixtures/")?.kind).toBe("fixtures");
    expect(result.repoZones.find((zone) => zone.path === "scripts/")?.kind).toBe("scripts");
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
