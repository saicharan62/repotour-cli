#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { createAnalyzerPipeline, runAnalyzers } from "./analyzers/index.js";
import { createEmptyProfile, createRepoContext } from "./profile.js";
import { renderHtml, renderMarkdown } from "./renderers/index.js";
import type { CliOptions, OutputFormat } from "./types.js";
import { walkRepository } from "./walker/index.js";

const program = new Command();

program
  .name("repotour")
  .description("Generate a fast orientation guide for an unfamiliar repository.")
  .argument("[repo]", "repository path", ".")
  .option("--html", "render standalone HTML")
  .option("--markdown", "render markdown")
  .option("-o, --output <file>", "write output to a file")
  .option("--max-import-files <count>", "maximum source files to sample for shallow imports", "80")
  .action(async (repo: string, options: CliOptions) => {
    const started = Date.now();
    const rootPath = path.resolve(repo);
    const format = chooseFormat(options);

    try {
      process.stderr.write(`repotour: scanning ${rootPath}\n`);
      const files = await walkRepository(rootPath);
      const context = createRepoContext(rootPath, files);
      const profile = await runAnalyzers(
        createEmptyProfile(context),
        context,
        createAnalyzerPipeline({ maxImportFiles: Number(options.maxImportFiles ?? 80) }),
      );
      const output = format === "html" ? renderHtml(profile) : renderMarkdown(profile);

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

program.parse();

function chooseFormat(options: CliOptions): OutputFormat {
  if (options.html) return "html";
  if (options.markdown) return "markdown";
  if (options.output?.toLowerCase().endsWith(".html")) return "html";
  return "markdown";
}
