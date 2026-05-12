import type { Analyzer, PackageBoundary } from "../types.js";
import { topLevelZone } from "../utils/paths.js";
import { scoreSignals, signal, topSignals } from "../utils/signals.js";

export const packageMapAnalyzer: Analyzer = {
  name: "package-map",
  analyze(profile) {
    const packageNames = new Map(
      profile.manifests
        .filter((manifest) => manifest.type === "package.json" && manifest.name)
        .map((manifest) => [manifest.name as string, packageRoot(manifest.path)]),
    );

    const packageMap: PackageBoundary[] = profile.manifests
      .filter((manifest) => manifest.type === "package.json")
      .map((manifest) => {
        const root = packageRoot(manifest.path);
        const dependencies = manifest.dependencies ?? [];
        const internalDependencies = dependencies.filter((dependency) => packageNames.has(dependency));
        const importHits = profile.importGraph.filter((edge) => topLevelZone(edge.from) === root || edge.from.startsWith(root)).length;
        const signals = topSignals([
          signal("package manifest", 28),
          internalDependencies.length ? signal(`${internalDependencies.length} internal package dependencies`, Math.min(24, internalDependencies.length * 8)) : signal("no detected internal dependencies", 0),
          importHits ? signal(`${importHits} sampled imports from package`, Math.min(22, importHits * 3)) : signal("low sampled import activity", 0),
          root.includes("fixtures/") || root.includes("examples/") ? signal("support package path", -20) : signal("runtime/package path", 8),
        ].filter((item) => item.weight !== 0));

        return {
          path: root,
          name: manifest.name ?? root,
          dependencies,
          internalDependencies,
          centrality: scoreSignals(signals),
          signals,
        };
      })
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 40);

    return { ...profile, packageMap };
  },
};

function packageRoot(manifestPath: string): string {
  if (manifestPath === "package.json") return ".";
  return manifestPath.replace(/\/package\.json$/, "/");
}
