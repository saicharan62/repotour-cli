import type { RepoProfile } from "../types.js";

export function renderMarkdown(profile: RepoProfile): string {
  return [
    `# ${profile.repoName} Orientation`,
    "",
    `Generated: ${profile.generatedAt}`,
    "",
    "## Snapshot",
    "",
    `- Primary language: **${profile.primaryLanguage}**`,
    `- Frameworks: ${profile.frameworks.map((framework) => `**${framework.name}**`).join(", ") || "None detected"}`,
    `- Architecture style: ${profile.architectureStyle ? `**${profile.architectureStyle.name}** (${profile.architectureStyle.confidence})` : "Unclassified"}`,
    `- Likely entrypoints: ${profile.entryPoints.length}`,
    `- Files in import sample: ${new Set(profile.importGraph.map((edge) => edge.from)).size}`,
    "",
    "## Architecture Overview",
    "",
    profile.architectureSummary ?? "No architecture summary available.",
    "",
    "## Suggested Reading Path",
    "",
    renderReadingPath(profile),
    "",
    "## Repo Zones",
    "",
    renderZones(profile),
    "",
    "## Execution Flow",
    "",
    renderExecutionFlows(profile),
    "",
    "## Zone Relationships",
    "",
    renderZoneRelationships(profile),
    "",
    "## Important Files",
    "",
    renderImportantFiles(profile),
    "",
    "## Likely Primary Entrypoints",
    "",
    renderEntryPoints(profile),
    "",
    "## Manifests",
    "",
    renderManifests(profile),
    "",
    "## Languages",
    "",
    renderLanguages(profile),
    "",
    "## Churn Hotspots",
    "",
    renderChurn(profile),
    "",
    "## Active Development Signals",
    "",
    renderTimeline(profile),
    "",
    "## Low Priority For First Pass",
    "",
    renderIgnoreGuidance(profile),
    "",
    "## Package Map",
    "",
    renderPackageMap(profile),
    "",
    "## Shallow Import Graph",
    "",
    renderImports(profile),
    "",
    "## README Signals",
    "",
    renderReadme(profile),
    profile.warnings.length ? `\n## Analyzer Warnings\n\n${profile.warnings.map((warning) => `- ${warning.source}: ${warning.message}`).join("\n")}` : "",
    "",
  ].join("\n");
}

function renderImportantFiles(profile: RepoProfile): string {
  if (!profile.importantFiles.length) return "_No high-signal files identified._";
  return profile.importantFiles.map((file, index) => `${index + 1}. \`${file.path}\` (${file.score}%) - ${file.reason}\n   signals: ${file.signals.map((item) => item.label).join("; ")}`).join("\n");
}

function renderEntryPoints(profile: RepoProfile): string {
  if (!profile.entryPoints.length) return "_No obvious entrypoints detected._";
  return profile.entryPoints
    .map((entry, index) => `${index + 1}. \`${entry.path}\`\n   confidence: ${entry.score}% (${entry.confidence})\n   ${entry.command ? `command: ${entry.command}\n   ` : ""}signals: ${entry.signals.map((item) => item.label).join("; ")}`)
    .join("\n");
}

function renderReadingPath(profile: RepoProfile): string {
  if (!profile.readingPath.length) return "_No suggested reading path available._";
  return profile.readingPath.map((item, index) => `${index + 1}. \`${item.path}\` - ${item.title}\n   ${item.reason}`).join("\n");
}

function renderZones(profile: RepoProfile): string {
  if (!profile.repoZones.length) return "_No repository zones detected._";
  return profile.repoZones
    .map((zone) => `- \`${zone.path}\` (${zone.kind}, ${zone.importance}%)\n  ${zone.summary}`)
    .join("\n");
}

function renderExecutionFlows(profile: RepoProfile): string {
  if (!profile.executionFlows.length) return "_No execution flow could be traced from sampled imports._";
  return profile.executionFlows
    .slice(0, 3)
    .map((flow) => [
      `### \`${flow.entrypoint}\` (${flow.score}%, ${flow.confidence})`,
      "",
      ...flow.steps.map((step) => `${"  ".repeat(step.depth)}- \`${step.path}\` - ${step.reason}`),
    ].join("\n"))
    .join("\n\n");
}

function renderZoneRelationships(profile: RepoProfile): string {
  if (!profile.zoneRelationships.length) return "_No cross-zone relationships detected in sampled imports._";
  return profile.zoneRelationships.map((relationship) => `- \`${relationship.from}\` -> \`${relationship.to}\` (${relationship.kind}, ${relationship.weight} links)`).join("\n");
}

function renderTimeline(profile: RepoProfile): string {
  if (!profile.timelineSignals.length) return "_No recent git activity clusters detected._";
  return profile.timelineSignals.map((item) => `- \`${item.path}\` - ${item.kind}: ${item.summary}`).join("\n");
}

function renderIgnoreGuidance(profile: RepoProfile): string {
  if (!profile.ignoreGuidance.length) return "_No obvious low-priority areas detected._";
  return profile.ignoreGuidance.map((item) => `- \`${item.path}\` (${item.confidence}) - ${item.reason}`).join("\n");
}

function renderPackageMap(profile: RepoProfile): string {
  if (!profile.packageMap.length) return "_No package boundaries detected._";
  return profile.packageMap.slice(0, 16).map((pkg) => `- \`${pkg.path}\` - ${pkg.name} (${pkg.centrality}%)${pkg.internalDependencies.length ? `; internal deps: ${pkg.internalDependencies.join(", ")}` : ""}`).join("\n");
}

function renderManifests(profile: RepoProfile): string {
  if (!profile.manifests.length) return "_No common manifests found._";
  return profile.manifests
    .slice(0, 24)
    .map((manifest) => {
      const deps = manifest.dependencies?.slice(0, 8).join(", ");
      return `- \`${manifest.path}\` - ${manifest.name ?? manifest.type}${manifest.version ? `@${manifest.version}` : ""}${deps ? `; deps: ${deps}` : ""}`;
    })
    .join("\n") + (profile.manifests.length > 24 ? `\n- _${profile.manifests.length - 24} more manifests omitted for focus._` : "");
}

function renderLanguages(profile: RepoProfile): string {
  if (!profile.languages.length) return "_No language statistics available._";
  return profile.languages.slice(0, 8).map((lang) => `- ${lang.language}: ${lang.files} files, ${lang.lines} lines`).join("\n");
}

function renderChurn(profile: RepoProfile): string {
  if (!profile.churnHotspots.length) return "_No recent git churn found. This can happen outside a git repository._";
  return profile.churnHotspots.map((file) => `- \`${file.path}\` - ${file.commits} commits, +${file.additions}/-${file.deletions}`).join("\n");
}

function renderImports(profile: RepoProfile): string {
  if (!profile.importGraph.length) return "_No shallow imports detected in the sampled files._";
  return profile.importGraph.slice(0, 40).map((edge) => `- \`${edge.from}\` -> \`${edge.to}\``).join("\n");
}

function renderReadme(profile: RepoProfile): string {
  if (!profile.readmeSections.length) return "_No setup, architecture, development, contributing, or deployment sections found._";
  return profile.readmeSections
    .map((section) => `### ${section.title}\n\n${section.content}`)
    .join("\n\n");
}
