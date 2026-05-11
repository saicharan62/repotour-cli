import { describe, expect, it } from "vitest";
import { runAnalyzers } from "../src/analyzers/index.js";
import { createEmptyProfile, createRepoContext } from "../src/profile.js";
import type { RepoFile } from "../src/types.js";

describe("analyzer pipeline", () => {
  it("keeps RepoProfile enrichment composable", async () => {
    const files: RepoFile[] = [
      {
        path: "package.json",
        absolutePath: new URL("../package.json", import.meta.url).pathname,
        extension: ".json",
        sizeBytes: 100,
      },
    ];
    const context = createRepoContext(process.cwd(), files);
    const profile = await runAnalyzers(createEmptyProfile(context), context, []);

    expect(profile.repoName).toBe("repotour");
    expect(profile.manifests).toEqual([]);
  });
});
