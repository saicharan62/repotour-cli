import type { Analyzer, ArchitectureStyle, RepoProfile } from "../types.js";
import { signal, topSignals } from "../utils/signals.js";

export const architectureAnalyzer: Analyzer = {
  name: "architecture",
  analyze(profile, context) {
    const styles = [
      detectMonorepo(profile.manifests.map((manifest) => manifest.path)),
      detectCliFirst(profile),
      detectLibrary(profile),
      detectLayeredBackend(context.files.map((file) => file.path)),
      detectPackageEcosystem(profile),
      detectMicroservice(context.files.map((file) => file.path)),
      detectPluginArchitecture(context.files.map((file) => file.path)),
    ].filter(Boolean) as ArchitectureStyle[];

    const architectureStyle = styles.sort((a, b) => totalWeight(b) - totalWeight(a))[0];
    return { ...profile, ...(architectureStyle ? { architectureStyle } : {}) };
  },
};

function detectMonorepo(manifestPaths: string[]): ArchitectureStyle | undefined {
  const packageManifests = manifestPaths.filter((path) => /^(packages|apps|services)\//.test(path));
  if (packageManifests.length < 2) return undefined;
  return {
    name: "Package-oriented monorepo",
    confidence: packageManifests.length >= 4 ? "high" : "medium",
    signals: topSignals([
      signal(`${packageManifests.length} nested package/app manifests`, Math.min(70, packageManifests.length * 18)),
      signal("package/app/service directory convention", 18),
    ]),
  };
}

function detectCliFirst(profile: RepoProfile): ArchitectureStyle | undefined {
  const hasCliEntry = profile.entryPoints.some((entry) => /(^|\/)(cli|cmd|bin)\b/.test(entry.path) || entry.command?.includes("tsx src/cli"));
  const hasBin = profile.manifests.some((manifest) => manifest.notes.some((note) => note.includes("bin")) || manifest.scripts?.dev?.includes("cli"));
  if (!hasCliEntry && !hasBin) return undefined;
  return {
    name: "CLI-first tool",
    confidence: hasCliEntry && hasBin ? "high" : "medium",
    signals: topSignals([
      hasCliEntry ? signal("CLI-shaped entrypoint", 42) : signal("no CLI entrypoint", 0),
      hasBin ? signal("manifest references CLI execution", 28) : signal("no manifest CLI signal", 0),
    ].filter((item) => item.weight !== 0)),
  };
}

function detectLibrary(profile: RepoProfile): ArchitectureStyle | undefined {
  const hasMain = profile.manifests.some((manifest) => manifest.notes.some((note) => note.startsWith("main:")));
  const hasRuntimeEntry = profile.entryPoints.some((entry) => entry.kind === "manifest");
  if (!hasMain && !hasRuntimeEntry) return undefined;
  return {
    name: "Library-oriented package",
    confidence: hasMain && hasRuntimeEntry ? "high" : "medium",
    signals: topSignals([
      hasMain ? signal("package manifest declares library main", 38) : signal("no package main", 0),
      hasRuntimeEntry ? signal("manifest entrypoint detected", 24) : signal("no manifest entrypoint", 0),
    ].filter((item) => item.weight !== 0)),
  };
}

function detectLayeredBackend(paths: string[]): ArchitectureStyle | undefined {
  const hasRoutes = paths.some((path) => /(^|\/)(routes|controllers|api)\//.test(path));
  const hasServices = paths.some((path) => /(^|\/)(services|domain)\//.test(path));
  const hasDb = paths.some((path) => /(^|\/)(db|database|models|migrations)\//.test(path));
  const score = [hasRoutes, hasServices, hasDb].filter(Boolean).length;
  if (score < 2) return undefined;
  return {
    name: "Layered backend",
    confidence: score === 3 ? "high" : "medium",
    signals: topSignals([
      hasRoutes ? signal("routes/controllers/API layer present", 26) : signal("no API layer", 0),
      hasServices ? signal("service/domain layer present", 26) : signal("no service layer", 0),
      hasDb ? signal("database/model layer present", 26) : signal("no db layer", 0),
    ].filter((item) => item.weight !== 0)),
  };
}

function detectPackageEcosystem(profile: RepoProfile): ArchitectureStyle | undefined {
  const packageZones = profile.repoZones.filter((zone) => zone.kind === "package");
  if (packageZones.length < 3) return undefined;
  return {
    name: "Framework package ecosystem",
    confidence: packageZones.length >= 6 ? "high" : "medium",
    signals: topSignals([
      signal(`${packageZones.length} package zones`, Math.min(70, packageZones.length * 10)),
      signal("package zones dominate orientation map", 14),
    ]),
  };
}

function detectMicroservice(paths: string[]): ArchitectureStyle | undefined {
  const serviceDirs = new Set(paths.flatMap((path) => path.match(/^services\/([^/]+)/)?.[1] ?? []));
  if (serviceDirs.size < 2) return undefined;
  return {
    name: "Microservice-oriented repository",
    confidence: serviceDirs.size >= 4 ? "high" : "medium",
    signals: topSignals([signal(`${serviceDirs.size} service directories`, Math.min(80, serviceDirs.size * 20))]),
  };
}

function detectPluginArchitecture(paths: string[]): ArchitectureStyle | undefined {
  const pluginPaths = paths.filter((path) => /(^|\/)(plugins?|extensions?)\//.test(path));
  if (pluginPaths.length < 4) return undefined;
  return {
    name: "Plugin architecture",
    confidence: pluginPaths.length >= 12 ? "high" : "medium",
    signals: topSignals([signal(`${pluginPaths.length} plugin/extension files`, Math.min(80, pluginPaths.length * 4))]),
  };
}

function totalWeight(style: ArchitectureStyle): number {
  return style.signals.reduce((total, item) => total + item.weight, 0);
}
