import fs from "node:fs/promises";
import type { Analyzer, ReadmeSection } from "../types.js";

const CATEGORY_PATTERNS: Array<[ReadmeSection["category"], RegExp]> = [
  ["setup", /setup|install|getting started|quickstart/i],
  ["architecture", /architecture|design|structure|internals/i],
  ["development", /development|local|test|workflow/i],
  ["contributing", /contributing|contribution/i],
  ["deployment", /deploy|release|production/i],
  ["overview", /overview|about|introduction|purpose/i],
];

export const readmeAnalyzer: Analyzer = {
  name: "readme",
  async analyze(profile, context) {
    const readme = context.files.find((file) => /^readme\.md$/i.test(file.path));
    if (!readme) return profile;
    const content = sanitizeMarkdown(await fs.readFile(readme.absolutePath, "utf8"));
    return { ...profile, readmeSections: extractSections(content).slice(0, 8) };
  },
};

function extractSections(content: string): ReadmeSection[] {
  const lines = content.split("\n");
  const sections: ReadmeSection[] = [];
  let current: { title: string; level: number; lines: string[] } | undefined = { title: "Overview", level: 1, lines: [] };

  for (const line of lines) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      if (current) pushIfUseful(sections, current);
      current = { level: heading[1]?.length ?? 1, title: heading[2] ?? "Overview", lines: [] };
      continue;
    }
    current?.lines.push(line);
  }

  if (current) pushIfUseful(sections, current);
  return sections;
}

function pushIfUseful(sections: ReadmeSection[], section: { title: string; level: number; lines: string[] }): void {
  const category = categorize(section.title);
  if (!category) return;
  const content = section.lines.join("\n").trim().replace(/\n{3,}/g, "\n\n").slice(0, 900);
  if (!content) return;
  sections.push({ title: section.title, level: section.level, content, category });
}

function categorize(title: string): ReadmeSection["category"] | undefined {
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(title)) return category;
  }
  return undefined;
}

function sanitizeMarkdown(content: string): string {
  return content
    .split("\n")
    .filter((line) => !isBadgeOrImage(line))
    .map((line) => line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1"))
    .map((line) => line.replace(/`{3,}[\w-]*/g, "```"))
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isBadgeOrImage(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^!\[[^\]]*]\([^)]+\)/.test(trimmed)) return true;
  const imageLinkCount = [...trimmed.matchAll(/!\[[^\]]*]\([^)]+\)/g)].length;
  const badgeHints = /badge|shield|travis|circleci|codecov|npm version|build status/i.test(trimmed);
  return imageLinkCount > 0 || (badgeHints && /^\[.*]\(.*\)$/.test(trimmed));
}
