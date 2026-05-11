import type { RepoProfile } from "../types.js";
import { renderMarkdown } from "./markdown.js";

export function renderHtml(profile: RepoProfile): string {
  const markdown = renderMarkdown(profile);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(profile.repoName)} Orientation</title>
  <style>
    :root { color-scheme: light; --bg: #f7f8fb; --panel: #ffffff; --text: #1d2433; --muted: #667085; --line: #d9dee8; --accent: #0f766e; --code: #eef4f3; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }
    header { padding: 40px 24px 24px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .shell { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 22px; padding: 28px 24px 56px; }
    nav { position: sticky; top: 16px; align-self: start; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
    nav a { display: block; color: var(--text); text-decoration: none; padding: 8px 10px; border-radius: 6px; font-size: 14px; }
    nav a:hover { background: var(--code); }
    main { min-width: 0; }
    .hero { max-width: 1080px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 40px; line-height: 1.05; letter-spacing: 0; }
    h2 { margin: 0; font-size: 18px; }
    .meta { color: var(--muted); margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
    .stat, details, .notice { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
    .stat { padding: 14px; }
    .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .value { margin-top: 6px; font-weight: 700; }
    details { margin-bottom: 12px; overflow: hidden; }
    summary { cursor: pointer; padding: 16px 18px; font-weight: 700; list-style: none; display: flex; justify-content: space-between; gap: 12px; }
    summary::after { content: "+"; color: var(--accent); }
    details[open] summary::after { content: "-"; }
    .content { border-top: 1px solid var(--line); padding: 18px; }
    ul, ol { padding-left: 24px; }
    li { margin: 7px 0; }
    code { background: var(--code); color: #0f3f3a; padding: 2px 6px; border-radius: 5px; font-size: .92em; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
    .read-first { columns: 2; column-gap: 32px; }
    .badge { display: inline-block; font-size: 12px; color: #0f3f3a; background: var(--code); border-radius: 999px; padding: 3px 8px; margin-left: 6px; }
    .signals { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .notice { padding: 16px 18px; margin-bottom: 12px; }
    @media (max-width: 860px) { h1 { font-size: 30px; } .grid { grid-template-columns: 1fr 1fr; } .read-first { columns: 1; } .shell { display: block; } nav { position: static; margin-bottom: 16px; } }
  </style>
</head>
<body>
  <header>
    <div class="hero">
      <h1>${escapeHtml(profile.repoName)}</h1>
      <p class="meta">Repository orientation generated ${escapeHtml(profile.generatedAt)}</p>
      <div class="grid">
        <div class="stat"><div class="label">Language</div><div class="value">${escapeHtml(profile.primaryLanguage)}</div></div>
        <div class="stat"><div class="label">Frameworks</div><div class="value">${escapeHtml(profile.frameworks.map((f) => f.name).join(", ") || "None")}</div></div>
        <div class="stat"><div class="label">Style</div><div class="value">${escapeHtml(profile.architectureStyle?.name ?? "Unclassified")}</div></div>
        <div class="stat"><div class="label">Entrypoints</div><div class="value">${profile.entryPoints.length}</div></div>
        <div class="stat"><div class="label">Hot Files</div><div class="value">${profile.importantFiles.length}</div></div>
      </div>
    </div>
  </header>
  <div class="shell">
    <nav>
      <a href="#architecture">Architecture</a>
      <a href="#reading">Reading Path</a>
      <a href="#zones">Repo Zones</a>
      <a href="#entrypoints">Entrypoints</a>
      <a href="#files">Important Files</a>
      <a href="#evidence">Evidence</a>
    </nav>
    <main>
      <div class="notice" id="architecture">${escapeHtml(profile.architectureSummary ?? "No architecture summary available.")}${profile.architectureStyle ? `<div class="signals">Style signals: ${escapeHtml(profile.architectureStyle.signals.map((item) => item.label).join("; "))}</div>` : ""}</div>
      ${section("Suggested Reading Path", ordered(profile.readingPath.map((item) => `<code>${escapeHtml(item.path)}</code> - <strong>${escapeHtml(item.title)}</strong><div class="signals">${escapeHtml(item.reason)}</div>`)), true, "read-first", "reading")}
      ${section("Repo Zones", list(profile.repoZones.map((zone) => `<code>${escapeHtml(zone.path)}</code> <span class="badge">${zone.importance}%</span> <span class="badge">${escapeHtml(zone.kind)}</span><div>${escapeHtml(zone.summary)}</div><div class="signals">${escapeHtml(zone.signals.map((item) => item.label).join("; "))}</div>`)), true, "", "zones")}
      ${section("Likely Primary Entrypoints", list(profile.entryPoints.map((entry) => `<code>${escapeHtml(entry.path)}</code> <span class="badge">${entry.score}%</span> <span class="badge">${entry.confidence}</span><div>${escapeHtml(entry.command ? `${entry.command}; ${entry.reason}` : entry.reason)}</div><div class="signals">${escapeHtml(entry.signals.map((item) => item.label).join("; "))}</div>`)), false, "", "entrypoints")}
      ${section("Important Files", ordered(profile.importantFiles.map((file) => `<code>${escapeHtml(file.path)}</code> <span class="badge">${file.score}%</span> - ${escapeHtml(file.reason)}<div class="signals">${escapeHtml(file.signals.map((item) => item.label).join("; "))}</div>`)), false, "read-first", "files")}
      ${section("Manifests", list(profile.manifests.slice(0, 20).map((manifest) => `<code>${escapeHtml(manifest.path)}</code> - ${escapeHtml(manifest.name ?? manifest.type)}`)), false, "", "evidence")}
      ${section("Languages", list(profile.languages.slice(0, 8).map((lang) => `${escapeHtml(lang.language)}: ${lang.files} files, ${lang.lines} lines`)))}
      ${section("Churn Hotspots", list(profile.churnHotspots.map((file) => `<code>${escapeHtml(file.path)}</code> - ${file.commits} commits, +${file.additions}/-${file.deletions}`)))}
      ${section("Shallow Import Graph", list(profile.importGraph.slice(0, 60).map((edge) => `<code>${escapeHtml(edge.from)}</code> -> <code>${escapeHtml(edge.to)}</code>`)))}
      ${section("README Signals", profile.readmeSections.map((readme) => `<h2>${escapeHtml(readme.title)}</h2><pre>${escapeHtml(readme.content)}</pre>`).join("") || "No useful README sections found.")}
      ${profile.warnings.length ? section("Warnings", list(profile.warnings.map((warning) => `${escapeHtml(warning.source)}: ${escapeHtml(warning.message)}`))) : ""}
    </main>
  </div>
  <script>
    document.querySelectorAll('details').forEach((details, index) => { if (index < 2) details.open = true; });
  </script>
</body>
</html>
<!-- Markdown source length: ${markdown.length} -->
`;
}

function section(title: string, content: string, open = false, className = "", id = ""): string {
  return `<details${open ? " open" : ""}${id ? ` id="${escapeHtml(id)}"` : ""}><summary>${escapeHtml(title)}</summary><div class="content ${className}">${content}</div></details>`;
}

function list(items: string[]): string {
  return items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : "<p>No data found.</p>";
}

function ordered(items: string[]): string {
  return items.length ? `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>` : "<p>No high-signal files identified.</p>";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
