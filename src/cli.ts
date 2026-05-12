#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { analyzeRepository } from "./engine/analyze.js";
import { parseGitHubInput } from "./remote/github.js";
import { renderHtml, renderJson, renderMarkdown } from "./renderers/index.js";
import { serveProfile } from "./server/serve.js";
import type { CliOptions, OutputFormat, RepoProfile } from "./types.js";

const program = new Command();

program
  .name("repotour")
  .description("Explore unfamiliar repositories through deterministic architecture maps.")
  .version("0.1.0");

program
  .argument("[repo]", "repository path, GitHub shorthand, or GitHub URL", ".")
  .description("Analyze a repository and emit markdown, JSON, graph JSON, flow JSON, or legacy HTML.")
  .option("--html", "render standalone HTML")
  .option("--markdown", "render markdown")
  .option("--json", "emit canonical RepoProfile JSON")
  .option("--interactive", "render interactive standalone HTML")
  .option("--graph", "emit architecture graph JSON")
  .option("--flow", "emit execution flow JSON")
  .option("--focus <query>", "focus graph/flow output around a path, zone kind, or node label")
  .option("--ignore-low-signal", "suppress low-priority graph nodes in graph JSON output")
  .option("-o, --output <file>", "write output to a file")
  .option("--max-import-files <count>", "maximum source files to sample for shallow imports", "80")
  .action(async (repo: string, options: CliOptions) => {
    const started = Date.now();
    const format = chooseFormat(options);

    try {
      process.stderr.write(`repotour: scanning ${repo}\n`);
      const { profile } = await analyzeRepository(repo, {
        maxImportFiles: Number(options.maxImportFiles ?? 80),
        cacheProfile: Boolean(parseGitHubInput(repo)),
      });
      const focusedProfile = applyFocus(profile, options);
      const output = chooseOutput(focusedProfile, options, format);

      if (options.output) {
        await fs.writeFile(path.resolve(options.output), output, "utf8");
        process.stderr.write(`repotour: wrote ${options.output} in ${Date.now() - started}ms\n`);
        return;
      }

      process.stdout.write(output);
      process.stderr.write(`\nrepotour: done in ${Date.now() - started}ms\n`);
    } catch (error) {
      process.stderr.write(`repotour: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("serve")
  .description("Analyze a repository and launch the React architecture explorer.")
  .argument("[repo]", "repository path, GitHub shorthand, or GitHub URL", ".")
  .option("--port <port>", "frontend port", "3000")
  .option("--api-port <port>", "profile API port", "3030")
  .option("--no-open", "do not open the browser automatically")
  .option("--max-import-files <count>", "maximum source files to sample for shallow imports", "120")
  .action(async (repo: string, options: { port: string; apiPort: string; open: boolean; maxImportFiles?: string }) => {
    try {
      process.stderr.write(`repotour: analyzing ${repo}\n`);
      const { profile, cachedProfilePath } = await analyzeRepository(repo, {
        maxImportFiles: Number(options.maxImportFiles ?? 120),
        cacheProfile: true,
      });
      if (cachedProfilePath) process.stderr.write(`repotour: cached profile at ${cachedProfilePath}\n`);
      await serveProfile(profile, {
        port: Number(options.port),
        apiPort: Number(options.apiPort),
        openBrowser: options.open,
      });
    } catch (error) {
      process.stderr.write(`repotour: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    }
  });

program.parse();

function chooseFormat(options: CliOptions): OutputFormat {
  if (options.html || options.interactive) return "html";
  if (options.markdown) return "markdown";
  if (options.output?.toLowerCase().endsWith(".html")) return "html";
  return "markdown";
}

function chooseOutput(profile: RepoProfile, options: CliOptions, format: OutputFormat): string {
  if (options.json) return renderJson(profile);
  if (options.graph) return `${JSON.stringify(profile.architectureGraph, null, 2)}\n`;
  if (options.flow) return `${JSON.stringify(profile.executionFlows, null, 2)}\n`;
  return format === "html" ? renderHtml(profile) : renderMarkdown(profile);
}

function applyFocus(profile: RepoProfile, options: CliOptions): RepoProfile {
  const query = options.focus?.toLowerCase();
  if (!query && !options.ignoreLowSignal) return profile;
  const graphNodes = profile.architectureGraph.nodes.filter((node) => {
    const matchesFocus = !query || node.path.toLowerCase().includes(query) || node.label.toLowerCase().includes(query) || node.kind.toLowerCase().includes(query) || node.role.toLowerCase().includes(query);
    const matchesSignal = !options.ignoreLowSignal || !node.lowSignal;
    return matchesFocus && matchesSignal;
  });
  const ids = new Set(graphNodes.map((node) => node.id));
  return {
    ...profile,
    architectureGraph: {
      nodes: graphNodes,
      edges: profile.architectureGraph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)),
    },
    executionFlows: query
      ? profile.executionFlows
        .map((flow) => ({ ...flow, steps: flow.steps.filter((step) => step.path.toLowerCase().includes(query) || step.role.toLowerCase().includes(query)) }))
        .filter((flow) => flow.entrypoint.toLowerCase().includes(query) || flow.steps.length)
      : profile.executionFlows,
  };
}
