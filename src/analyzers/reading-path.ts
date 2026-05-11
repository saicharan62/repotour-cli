import type { Analyzer, ReadingPathItem } from "../types.js";

export const readingPathAnalyzer: Analyzer = {
  name: "reading-path",
  analyze(profile) {
    const items: ReadingPathItem[] = [];
    const add = (path: string | undefined, title: string, reason: string, score: number) => {
      if (!path || items.some((item) => item.path === path)) return;
      items.push({ path, title, reason, score });
    };

    const primaryManifest = profile.manifests.find((manifest) => manifest.path === "package.json") ?? profile.manifests[0];
    add(primaryManifest?.path, "Project contract", "Understand scripts, dependencies, and package/runtime conventions.", 100);

    const primaryEntry = profile.entryPoints[0];
    add(primaryEntry?.path, "Execution start", primaryEntry ? primaryEntry.reason : "Most likely runtime entrypoint.", 95);

    const coreZone = profile.repoZones.find((zone) => ["runtime/core", "api", "cli", "package"].includes(zone.kind));
    add(coreZone?.path, "Core zone", coreZone?.summary ?? "Read the primary runtime area.", 82);

    const apiZone = profile.repoZones.find((zone) => zone.kind === "api");
    add(apiZone?.path, "External surface", "Review routes, controllers, or public API boundaries.", 76);

    const centralFile = profile.importantFiles.find((file) => !items.some((item) => item.path === file.path));
    add(centralFile?.path, "Central module", centralFile?.reason ?? "High-signal module in the import/churn graph.", 70);

    const toolingZone = profile.repoZones.find((zone) => ["tooling", "scripts"].includes(zone.kind));
    add(toolingZone?.path, "Developer workflow", "Skim build, test, and automation after the runtime path is clear.", 55);

    return { ...profile, readingPath: items.sort((a, b) => b.score - a.score).slice(0, 7) };
  },
};
