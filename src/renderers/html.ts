import type { RepoProfile } from "../types.js";
import { renderMarkdown } from "./markdown.js";

export function renderHtml(profile: RepoProfile): string {
  const markdown = renderMarkdown(profile);
  const data = jsonForScript(profile);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(profile.repoName)} Architecture Map</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --panel-soft: #f9fafb;
      --text: #1d2433;
      --muted: #667085;
      --line: #d9dee8;
      --line-strong: #aeb8c8;
      --accent: #0f766e;
      --accent-soft: #e5f3f1;
      --blue-soft: #e9eef8;
      --amber-soft: #f8f0df;
      --red-soft: #f8e9e7;
      --code: #eef4f3;
      --shadow: 0 12px 28px rgba(25, 35, 55, .08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    header {
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      padding: 18px 24px 16px;
    }
    .topbar {
      max-width: 1480px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
    }
    h1 { margin: 0 0 5px; font-size: 28px; line-height: 1.12; }
    .meta { color: var(--muted); margin: 0; font-size: 14px; }
    .summary { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--panel-soft);
      color: var(--text);
      padding: 4px 10px;
      font-size: 13px;
      white-space: nowrap;
    }
    .app {
      max-width: 1480px;
      margin: 0 auto;
      padding: 16px 24px 28px;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr) 340px;
      gap: 14px;
      min-height: calc(100vh - 92px);
    }
    .sidebar, .inspector {
      position: sticky;
      top: 14px;
      align-self: start;
      max-height: calc(100vh - 28px);
      overflow: auto;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: none;
    }
    .panel + .panel { margin-top: 12px; }
    .panel-header {
      padding: 12px 13px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .panel-title { font-weight: 800; font-size: 14px; }
    .panel-body { padding: 12px; }
    input[type="search"] {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 9px 10px;
      color: var(--text);
      background: #fff;
      font: inherit;
    }
    button {
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 7px;
      padding: 8px 10px;
      font: inherit;
      cursor: pointer;
    }
    button:hover, button.active {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
    .mode-grid { display: grid; gap: 7px; }
    .mode-button {
      width: 100%;
      text-align: left;
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr);
      gap: 8px;
      align-items: start;
    }
    .mode-key {
      display: inline-grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: var(--panel-soft);
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
    }
    .mode-button.active .mode-key { background: var(--accent); color: #fff; }
    .mode-title { font-weight: 800; }
    .mode-copy { color: var(--muted); font-size: 12px; margin-top: 2px; }
    .toolbar {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
      align-items: center;
    }
    .workspace {
      min-width: 0;
      display: grid;
      grid-template-rows: auto minmax(560px, 1fr) auto;
      gap: 14px;
    }
    .narrative {
      padding: 14px 16px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
    }
    .narrative strong { display: block; margin-bottom: 4px; }
    .narrative p { margin: 0; color: var(--muted); }
    .canvas {
      position: relative;
      overflow: hidden;
      min-height: 560px;
      background:
        linear-gradient(#edf0f4 1px, transparent 1px),
        linear-gradient(90deg, #edf0f4 1px, transparent 1px),
        #fbfcfe;
      background-size: 28px 28px;
    }
    .canvas-scroll {
      position: absolute;
      inset: 0;
      overflow: auto;
      padding: 26px;
    }
    .view-stage {
      min-width: 860px;
      min-height: 500px;
      position: relative;
    }
    .view-title {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .view-title h2 { margin: 0 0 4px; font-size: 20px; }
    .view-title p { margin: 0; color: var(--muted); max-width: 760px; }
    .lane-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(190px, 1fr));
      gap: 12px;
      align-items: start;
    }
    .lane {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255,255,255,.76);
      min-height: 360px;
      padding: 11px;
    }
    .lane-title {
      font-size: 12px;
      text-transform: uppercase;
      color: var(--muted);
      letter-spacing: .08em;
      margin: 0 0 10px;
    }
    .card-grid { display: grid; gap: 9px; }
    .arch-card {
      border: 1px solid var(--line);
      border-left: 4px solid var(--line-strong);
      border-radius: 8px;
      background: #fff;
      padding: 10px;
      cursor: pointer;
      box-shadow: 0 1px 0 rgba(20, 30, 50, .03);
      transition: transform .16s ease, border-color .16s ease, opacity .16s ease;
    }
    .arch-card:hover {
      transform: translateY(-1px);
      border-color: var(--accent);
    }
    .arch-card.selected {
      border-color: var(--accent);
      box-shadow: var(--shadow);
    }
    .arch-card.dimmed { opacity: .25; }
    .arch-card.low { opacity: .48; }
    .arch-card.entrypoint { border-left-color: var(--accent); background: #f7fffd; }
    .arch-card.zone { border-left-color: #546a92; background: #fbfcff; }
    .arch-card.package { border-left-color: #8a6b2c; background: #fffdf7; }
    .arch-card.hotspot { border-left-color: #9a4b3f; background: #fffafa; }
    .card-kicker { color: var(--muted); font-size: 12px; display: flex; justify-content: space-between; gap: 8px; }
    .card-title { font-weight: 800; margin-top: 4px; overflow-wrap: anywhere; }
    .card-role { color: var(--muted); font-size: 13px; margin-top: 5px; }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: var(--code);
      color: #17433f;
      padding: 2px 7px;
      font-size: 12px;
      white-space: nowrap;
    }
    .breadcrumb {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 12px;
    }
    .crumb {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 999px;
      padding: 4px 9px;
      cursor: pointer;
    }
    .region-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .region {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255,255,255,.8);
      overflow: hidden;
    }
    .region-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 11px 12px;
      border-bottom: 1px solid var(--line);
      cursor: pointer;
    }
    .region-title { font-weight: 800; }
    .region-body { padding: 11px; display: grid; gap: 8px; }
    .region.collapsed .region-body { display: none; }
    .sequence {
      display: grid;
      gap: 10px;
      max-width: 920px;
    }
    .sequence-step {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--accent);
      color: #fff;
      font-weight: 800;
    }
    .connector {
      position: absolute;
      pointer-events: none;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .connector path {
      fill: none;
      stroke: #a7b0c0;
      stroke-width: 1.6;
      stroke-dasharray: 3 4;
    }
    .inspector .panel-body { display: grid; gap: 12px; }
    .inspector-title { font-size: 17px; font-weight: 900; overflow-wrap: anywhere; }
    .inspector-role { color: var(--muted); line-height: 1.45; }
    .evidence-block {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      background: var(--panel-soft);
    }
    .evidence-title { font-weight: 800; font-size: 13px; margin-bottom: 6px; }
    .evidence-list { margin: 0; padding-left: 18px; color: var(--muted); font-size: 13px; }
    .evidence-list li { margin: 4px 0; }
    .mini-map {
      height: 92px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfe;
      position: relative;
      overflow: hidden;
    }
    .mini-dot {
      position: absolute;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--line-strong);
    }
    .mini-dot.active { background: var(--accent); width: 9px; height: 9px; }
    .tour {
      position: fixed;
      inset: 0;
      display: none;
      z-index: 20;
      background: rgba(246,247,249,.72);
      backdrop-filter: blur(2px);
    }
    .tour.open { display: grid; place-items: center; }
    .tour-card {
      width: min(640px, calc(100vw - 40px));
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 18px;
    }
    .tour-card h2 { margin: 0 0 8px; }
    .tour-card p { color: var(--muted); line-height: 1.5; }
    .tour-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 16px; }
    .empty { color: var(--muted); }
    code { background: var(--code); color: #17433f; padding: 2px 6px; border-radius: 5px; font-size: .92em; }
    @media (max-width: 1120px) {
      .app { grid-template-columns: 1fr; }
      .sidebar, .inspector { position: static; max-height: none; }
      .lane-grid, .region-grid { grid-template-columns: 1fr; }
      .summary { justify-content: flex-start; }
      .topbar { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <div>
        <h1>${escapeHtml(profile.repoName)}</h1>
        <p class="meta">${escapeHtml(profile.architectureSummary ?? "Interactive repository orientation")}</p>
      </div>
      <div class="summary">
        <span class="pill">${escapeHtml(profile.primaryLanguage)}</span>
        <span class="pill">${escapeHtml(profile.architectureStyle?.name ?? "Unclassified")}</span>
        <span class="pill">${profile.entryPoints.length} entrypoints</span>
        <span class="pill">${profile.repoZones.length} zones</span>
      </div>
    </div>
  </header>
  <div class="app">
    <aside class="sidebar">
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Exploration Mode</div></div>
        <div class="panel-body">
          <div class="mode-grid">
            <button class="mode-button active" data-mode="runtime"><span class="mode-key">1</span><span><span class="mode-title">Runtime</span><span class="mode-copy">Entrypoints, orchestration, execution path.</span></span></button>
            <button class="mode-button" data-mode="package"><span class="mode-key">2</span><span><span class="mode-title">Package</span><span class="mode-copy">Boundaries, workspaces, package topology.</span></span></button>
            <button class="mode-button" data-mode="learning"><span class="mode-key">3</span><span><span class="mode-title">Learning</span><span class="mode-copy">Recommended onboarding sequence.</span></span></button>
            <button class="mode-button" data-mode="hotspot"><span class="mode-key">4</span><span><span class="mode-title">Hotspot</span><span class="mode-copy">Central, active, and coordination-heavy files.</span></span></button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Focus</div></div>
        <div class="panel-body">
          <input id="search" type="search" placeholder="Search paths, roles, evidence">
          <div class="toolbar" style="margin-top:10px">
            <button data-focus="all" class="active">All</button>
            <button data-focus="runtime">Runtime</button>
            <button data-focus="entrypoint">Entrypoints</button>
            <button data-focus="low">Low priority</button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Zones</div></div>
        <div class="panel-body"><div id="zone-list" class="card-grid"></div></div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Ignore Initially</div></div>
        <div class="panel-body"><div id="ignore-list" class="card-grid"></div></div>
      </section>
    </aside>
    <main class="workspace">
      <section class="panel narrative">
        <div>
          <strong id="view-heading">Runtime Map</strong>
          <p id="view-copy">Follow likely execution from entrypoint to orchestration and output.</p>
        </div>
        <div class="toolbar">
          <button id="tour-start">Take a Tour</button>
          <button id="collapse-low">Collapse Low Priority</button>
          <button id="reset-view">Reset</button>
        </div>
      </section>
      <section class="panel canvas">
        <div class="canvas-scroll">
          <div class="view-stage">
            <svg id="connectors" class="connector" aria-hidden="true"></svg>
            <div id="map"></div>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Execution Steps</div><span class="badge">click any step to inspect</span></div>
        <div class="panel-body"><div id="flow-strip" class="sequence"></div></div>
      </section>
    </main>
    <aside class="inspector">
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Inspector</div><span id="selected-kind" class="badge">none</span></div>
        <div class="panel-body" id="inspector"></div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Mini Map</div></div>
        <div class="panel-body"><div id="mini-map" class="mini-map"></div></div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Relationships</div></div>
        <div class="panel-body"><div id="relationship-list" class="card-grid"></div></div>
      </section>
      <section class="panel">
        <div class="panel-header"><div class="panel-title">Active Areas</div></div>
        <div class="panel-body"><div id="timeline-list" class="card-grid"></div></div>
      </section>
    </aside>
  </div>
  <div id="tour" class="tour" role="dialog" aria-modal="true">
    <div class="tour-card">
      <div class="badge" id="tour-count">Step 1</div>
      <h2 id="tour-title">Execution begins here</h2>
      <p id="tour-copy"></p>
      <div class="tour-actions">
        <button id="tour-close">Close</button>
        <div class="toolbar">
          <button id="tour-prev">Previous</button>
          <button id="tour-next">Next</button>
        </div>
      </div>
    </div>
  </div>
  <script id="repotour-data" type="application/json">${data}</script>
  <script>
    const profile = JSON.parse(document.getElementById('repotour-data').textContent);
    const graph = profile.architectureGraph || { nodes: [], edges: [] };
    const byId = new Map(graph.nodes.map(node => [node.id, node]));
    const state = { mode: 'runtime', focus: 'all', query: '', selected: graph.nodes[0]?.id || null, collapseLow: false, tourIndex: 0 };
    const map = document.getElementById('map');
    const connectors = document.getElementById('connectors');
    const inspector = document.getElementById('inspector');

    const modeCopy = {
      runtime: ['Runtime Map', 'Follow likely execution from entrypoint to orchestration and output.'],
      package: ['Package Topology', 'Inspect package boundaries, workspace shape, and internal dependencies.'],
      learning: ['Learning Path', 'Walk the recommended sequence for understanding the codebase.'],
      hotspot: ['Hotspot Map', 'Find central, active, and coordination-heavy modules.']
    };

    function allCards() {
      const nodeCards = graph.nodes.map(node => ({ id: node.id, path: node.path, title: node.label, kind: node.kind, role: node.role, importance: node.importance, low: node.lowSignal, signals: node.signals || [] }));
      const packageCards = (profile.packageMap || []).map(pkg => ({ id: 'pkg:' + pkg.path, path: pkg.path, title: pkg.name, kind: 'package', role: 'Package boundary at ' + pkg.path, importance: pkg.centrality, low: pkg.path.includes('fixtures') || pkg.path.includes('examples'), signals: pkg.signals || [] }));
      const readingCards = (profile.readingPath || []).map((item, index) => ({ id: 'read:' + item.path, path: item.path, title: item.title, kind: 'learning', role: item.reason, importance: item.score || (90 - index * 8), low: false, signals: [{ label: 'reading step ' + (index + 1), weight: item.score || 50 }] }));
      return [...nodeCards, ...packageCards, ...readingCards];
    }

    function cardMatches(card) {
      const query = state.query.toLowerCase();
      const search = !query || [card.path, card.title, card.kind, card.role].join(' ').toLowerCase().includes(query);
      const focus = state.focus === 'all' ||
        (state.focus === 'runtime' && !card.low && ['entrypoint', 'module', 'zone', 'learning'].includes(card.kind)) ||
        (state.focus === 'entrypoint' && card.kind === 'entrypoint') ||
        (state.focus === 'low' && card.low);
      return search && focus && !(state.collapseLow && card.low && state.focus !== 'low');
    }

    function select(id) {
      state.selected = id;
      render();
    }

    function render() {
      document.getElementById('view-heading').textContent = modeCopy[state.mode][0];
      document.getElementById('view-copy').textContent = modeCopy[state.mode][1];
      renderSideLists();
      if (state.mode === 'runtime') renderRuntimeMode();
      if (state.mode === 'package') renderPackageMode();
      if (state.mode === 'learning') renderLearningMode();
      if (state.mode === 'hotspot') renderHotspotMode();
      renderFlowStrip();
      renderInspector();
      renderMiniMap();
    }

    function renderRuntimeMode() {
      const flow = (profile.executionFlows || [])[0];
      const steps = flow?.steps || [];
      const lanes = [
        { title: 'Entrypoint', roles: ['entrypoint'] },
        { title: 'Orchestration', roles: ['orchestrator'] },
        { title: 'Runtime Modules', roles: ['runtime-module', 'unknown'] },
        { title: 'External / Output', roles: ['external-package'] }
      ];
      map.innerHTML = '<div class="view-title"><div><h2>Runtime execution lane</h2><p>Primary path first. Support modules are intentionally muted until you focus them.</p></div><span class="badge">' + esc(steps.length) + ' traced steps</span></div>' +
        '<div class="lane-grid">' + lanes.map(lane => '<section class="lane"><div class="lane-title">' + esc(lane.title) + '</div><div class="card-grid">' +
          steps.filter(step => lane.roles.includes(step.role)).map(step => renderCard(cardFromStep(step), { compact: true })).join('') +
          '</div></section>').join('') + '</div>';
      wireCards();
      drawLaneConnectors();
    }

    function renderPackageMode() {
      const packages = (profile.packageMap || []).map(pkg => ({ id: 'pkg:' + pkg.path, path: pkg.path, title: pkg.name, kind: 'package', role: (pkg.internalDependencies || []).length ? 'Depends on internal packages: ' + pkg.internalDependencies.join(', ') : 'Package boundary with no detected internal package dependencies.', importance: pkg.centrality, low: pkg.path.includes('fixtures') || pkg.path.includes('examples'), signals: pkg.signals || [] })).filter(cardMatches);
      map.innerHTML = '<div class="view-title"><div><h2>Package boundaries</h2><p>Workspace topology compressed to package-level units. Central packages appear first.</p></div><span class="badge">' + esc(packages.length) + ' packages</span></div>' +
        '<div class="region-grid">' + packages.map(pkg => '<section class="region"><div class="region-header" data-toggle-region><div><div class="region-title">' + esc(pkg.title) + '</div><div class="item-sub">' + esc(pkg.path) + '</div></div><span class="badge">' + esc(pkg.importance) + '%</span></div><div class="region-body">' + renderCard(pkg) + '</div></section>').join('') + '</div>';
      wireCards();
      wireRegions();
      clearConnectors();
    }

    function renderLearningMode() {
      const items = (profile.readingPath || []).map((item, index) => ({ id: 'read:' + item.path, path: item.path, title: item.title, kind: 'learning', role: item.reason, importance: item.score || (90 - index * 8), low: false, signals: [{ label: 'recommended reading step ' + (index + 1), weight: item.score || 50 }] })).filter(cardMatches);
      map.innerHTML = '<div class="view-title"><div><h2>Guided learning path</h2><p>Read in this order to build a mental model before diving into details.</p></div><button id="tour-start-inline">Take a Tour</button></div>' +
        '<div class="sequence">' + items.map((item, index) => '<div class="sequence-step"><div class="step-number">' + (index + 1) + '</div>' + renderCard(item) + '</div>').join('') + '</div>';
      document.getElementById('tour-start-inline')?.addEventListener('click', startTour);
      wireCards();
      clearConnectors();
    }

    function renderHotspotMode() {
      const hotFiles = (profile.importantFiles || []).map(file => ({ id: graph.nodes.find(node => node.path === file.path)?.id || 'hot:' + file.path, path: file.path, title: file.path, kind: 'hotspot', role: file.reason, importance: file.score, low: false, signals: file.signals || [] })).filter(cardMatches);
      const active = (profile.timelineSignals || []).map(item => ({ id: 'time:' + item.path, path: item.path, title: item.path, kind: 'hotspot', role: item.summary, importance: item.score, low: false, signals: [{ label: item.kind, weight: item.score }] }));
      const combined = [...hotFiles, ...active].slice(0, 24);
      map.innerHTML = '<div class="view-title"><div><h2>Operational hotspots</h2><p>Files and zones with centrality, churn, or coordination pressure.</p></div><span class="badge">' + esc(combined.length) + ' signals</span></div>' +
        '<div class="region-grid">' + combined.map(item => renderCard(item)).join('') + '</div>';
      wireCards();
      clearConnectors();
    }

    function cardFromStep(step) {
      const node = graph.nodes.find(candidate => candidate.path === step.path);
      return {
        id: node?.id || 'flow:' + step.path,
        path: step.path,
        title: step.path,
        kind: step.role === 'entrypoint' ? 'entrypoint' : 'module',
        role: step.reason,
        importance: node?.importance || 45,
        low: node?.lowSignal || false,
        signals: step.signals || node?.signals || []
      };
    }

    function renderCard(card, options = {}) {
      const selected = card.id === state.selected || graph.nodes.find(node => node.path === card.path)?.id === state.selected;
      const dimmed = !cardMatches(card);
      return '<article class="arch-card ' + esc(card.kind) + (card.low ? ' low' : '') + (selected ? ' selected' : '') + (dimmed ? ' dimmed' : '') + '" data-card-id="' + esc(card.id) + '" data-path="' + esc(card.path) + '">' +
        '<div class="card-kicker"><span>' + esc(card.kind) + '</span><span class="badge">' + esc(Math.round(card.importance || 0)) + '%</span></div>' +
        '<div class="card-title">' + esc(options.compact ? compact(card.title, 34) : card.title) + '</div>' +
        '<div class="card-role">' + esc(compact(card.role || 'No role recorded.', options.compact ? 86 : 140)) + '</div>' +
        '</article>';
    }

    function renderSideLists() {
      renderList('zone-list', profile.repoZones || [], zone => ({ id: graph.nodes.find(node => node.path === zone.path)?.id || 'zone:' + zone.path, title: zone.label, sub: zone.kind + ' - ' + zone.importance + '%', low: ['tests', 'fixtures', 'examples', 'docs'].includes(zone.kind) }));
      renderList('ignore-list', profile.ignoreGuidance || [], item => ({ id: graph.nodes.find(node => node.path === item.path)?.id || '', title: item.path, sub: item.reason, low: true }));
      renderList('relationship-list', profile.zoneRelationships || [], item => ({ id: graph.nodes.find(node => node.path === item.from)?.id || '', title: item.from + ' -> ' + item.to, sub: item.kind + ' - ' + item.weight + ' links' }));
      renderList('timeline-list', profile.timelineSignals || [], item => ({ id: graph.nodes.find(node => node.path === item.path)?.id || '', title: item.path, sub: item.kind + ' - ' + item.summary }));
    }

    function renderList(id, items, mapper) {
      const container = document.getElementById(id);
      if (!container) return;
      if (!items.length) {
        container.innerHTML = '<p class="empty">No signals detected.</p>';
        return;
      }
      container.innerHTML = items.slice(0, 12).map(item => {
        const mapped = mapper(item);
        return '<article class="arch-card ' + (mapped.low ? 'low' : '') + '" data-card-id="' + esc(mapped.id) + '"><div class="card-title">' + esc(mapped.title) + '</div><div class="card-role">' + esc(mapped.sub || '') + '</div></article>';
      }).join('');
      wireCards(container);
    }

    function renderFlowStrip() {
      const flow = (profile.executionFlows || [])[0];
      const container = document.getElementById('flow-strip');
      if (!flow) {
        container.innerHTML = '<p class="empty">No execution flow could be traced.</p>';
        return;
      }
      container.innerHTML = flow.steps.slice(0, 10).map((step, index) => '<div class="sequence-step"><div class="step-number">' + (index + 1) + '</div>' + renderCard(cardFromStep(step), { compact: true }) + '</div>').join('');
      wireCards(container);
    }

    function renderInspector() {
      const selected = resolveSelected();
      const kind = document.getElementById('selected-kind');
      if (!selected) {
        inspector.innerHTML = '<p class="empty">Select a module, zone, package, or reading step.</p>';
        kind.textContent = 'none';
        return;
      }
      kind.textContent = selected.kind;
      const node = byId.get(selected.id);
      const outgoing = graph.edges.filter(edge => edge.from === selected.id).map(edge => byId.get(edge.to)?.label).filter(Boolean);
      const incoming = graph.edges.filter(edge => edge.to === selected.id).map(edge => byId.get(edge.from)?.label).filter(Boolean);
      inspector.innerHTML =
        '<div class="inspector-title">' + esc(selected.title) + '</div>' +
        '<div class="inspector-role">' + esc(selected.role) + '</div>' +
        evidence('Why this matters', (selected.signals || []).map(signal => signal.label)) +
        evidence('Depends on', outgoing.length ? outgoing.slice(0, 8) : ['No outgoing relationships in the focused map.']) +
        evidence('Used by', incoming.length ? incoming.slice(0, 8) : ['No incoming relationships in the focused map.']) +
        evidence('Path context', [selected.path, node?.lowSignal ? 'Low-priority/support signal detected.' : 'Included in primary architecture view.']);
    }

    function evidence(title, items) {
      return '<div class="evidence-block"><div class="evidence-title">' + esc(title) + '</div><ul class="evidence-list">' + items.map(item => '<li>' + esc(item) + '</li>').join('') + '</ul></div>';
    }

    function resolveSelected() {
      const node = byId.get(state.selected);
      if (node) return { id: node.id, path: node.path, title: node.label, kind: node.kind, role: node.role, importance: node.importance, low: node.lowSignal, signals: node.signals || [] };
      return allCards().find(card => card.id === state.selected) || null;
    }

    function renderMiniMap() {
      const container = document.getElementById('mini-map');
      const cards = allCards().filter(cardMatches).slice(0, 40);
      container.innerHTML = cards.map((card, index) => {
        const x = 8 + (index % 10) * 10;
        const y = 10 + Math.floor(index / 10) * 18;
        const active = card.id === state.selected || graph.nodes.find(node => node.path === card.path)?.id === state.selected;
        return '<span class="mini-dot ' + (active ? 'active' : '') + '" style="left:' + x + '%;top:' + y + 'px"></span>';
      }).join('');
    }

    function drawLaneConnectors() {
      requestAnimationFrame(() => {
        const cards = [...map.querySelectorAll('.arch-card')];
        connectors.innerHTML = '';
        connectors.setAttribute('width', String(map.offsetWidth || 900));
        connectors.setAttribute('height', String(map.offsetHeight || 540));
        for (let index = 0; index < cards.length - 1; index += 1) {
          const a = cards[index].getBoundingClientRect();
          const b = cards[index + 1].getBoundingClientRect();
          const base = map.getBoundingClientRect();
          const x1 = a.right - base.left;
          const y1 = a.top + a.height / 2 - base.top;
          const x2 = b.left - base.left;
          const y2 = b.top + b.height / 2 - base.top;
          if (x2 < x1) continue;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + 60) + ' ' + y1 + ', ' + (x2 - 60) + ' ' + y2 + ', ' + x2 + ' ' + y2);
          connectors.appendChild(path);
        }
      });
    }

    function clearConnectors() { connectors.innerHTML = ''; }

    function wireCards(root = document) {
      root.querySelectorAll('[data-card-id]').forEach(element => {
        element.addEventListener('click', () => {
          const id = element.getAttribute('data-card-id');
          if (id) select(id);
        });
        element.addEventListener('mouseenter', () => element.classList.add('selected'));
        element.addEventListener('mouseleave', () => element.classList.remove('selected'));
      });
    }

    function wireRegions() {
      document.querySelectorAll('[data-toggle-region]').forEach(header => {
        header.addEventListener('dblclick', () => header.closest('.region')?.classList.toggle('collapsed'));
      });
    }

    function startTour() {
      state.tourIndex = 0;
      document.getElementById('tour').classList.add('open');
      renderTour();
    }

    function tourSteps() {
      const flow = (profile.executionFlows || [])[0];
      const runtime = (flow?.steps || []).slice(0, 5).map((step, index) => ({ title: index === 0 ? 'Execution begins here' : 'Control moves through this runtime step', copy: step.reason, path: step.path }));
      const reading = (profile.readingPath || []).slice(0, 4).map((item, index) => ({ title: 'Reading step ' + (index + 1) + ': ' + item.title, copy: item.reason, path: item.path }));
      return runtime.length ? runtime : reading;
    }

    function renderTour() {
      const steps = tourSteps();
      const step = steps[state.tourIndex];
      if (!step) return;
      const node = graph.nodes.find(candidate => candidate.path === step.path);
      if (node) state.selected = node.id;
      document.getElementById('tour-count').textContent = 'Step ' + (state.tourIndex + 1) + ' of ' + steps.length;
      document.getElementById('tour-title').textContent = step.title;
      document.getElementById('tour-copy').textContent = step.copy + ' Path: ' + step.path;
      render();
    }

    function compact(value, max) { value = String(value || ''); return value.length > max ? value.slice(0, max - 1) + '...' : value; }
    function esc(value) { return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

    document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-mode]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.mode = button.dataset.mode;
      render();
    }));
    document.querySelectorAll('[data-focus]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-focus]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.focus = button.dataset.focus;
      render();
    }));
    document.getElementById('search').addEventListener('input', event => { state.query = event.target.value; render(); });
    document.getElementById('collapse-low').addEventListener('click', () => { state.collapseLow = !state.collapseLow; render(); });
    document.getElementById('reset-view').addEventListener('click', () => { state.focus = 'all'; state.query = ''; state.collapseLow = false; document.getElementById('search').value = ''; render(); });
    document.getElementById('tour-start').addEventListener('click', startTour);
    document.getElementById('tour-close').addEventListener('click', () => document.getElementById('tour').classList.remove('open'));
    document.getElementById('tour-prev').addEventListener('click', () => { state.tourIndex = Math.max(0, state.tourIndex - 1); renderTour(); });
    document.getElementById('tour-next').addEventListener('click', () => { const last = Math.max(0, tourSteps().length - 1); state.tourIndex = Math.min(last, state.tourIndex + 1); renderTour(); });
    document.addEventListener('keydown', event => {
      if (event.key === '/') { event.preventDefault(); document.getElementById('search').focus(); }
      if (event.key === 'Escape') document.getElementById('tour').classList.remove('open');
      if (['1', '2', '3', '4'].includes(event.key)) document.querySelector('[data-mode="' + ['runtime','package','learning','hotspot'][Number(event.key) - 1] + '"]')?.click();
    });
    render();
  </script>
</body>
</html>
<!-- Markdown source length: ${markdown.length} -->
`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function jsonForScript(profile: RepoProfile): string {
  return JSON.stringify(profile)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("</script", "<\\/script");
}
