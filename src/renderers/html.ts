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
  <title>${escapeHtml(profile.repoName)} Orientation</title>
  <style>
    :root { color-scheme: light; --bg: #f7f8fb; --panel: #ffffff; --text: #1d2433; --muted: #667085; --line: #d9dee8; --accent: #0f766e; --soft: #e7f3f1; --warn: #8a4b12; --code: #eef4f3; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }
    header { padding: 22px 24px 18px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .hero { max-width: 1360px; margin: 0 auto; }
    h1 { margin: 0 0 6px; font-size: 30px; line-height: 1.1; letter-spacing: 0; }
    h2 { margin: 0; font-size: 18px; }
    .meta { color: var(--muted); margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
    .stat, .panel, .node-card, .flow-step { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
    .stat { padding: 14px; }
    .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    .value { margin-top: 6px; font-weight: 700; }
    .app { max-width: 1360px; margin: 0 auto; padding: 18px 24px 32px; display: grid; grid-template-columns: 270px minmax(0, 1fr) 330px; gap: 14px; min-height: calc(100vh - 156px); }
    .sidebar, .inspector { position: sticky; top: 14px; align-self: start; max-height: calc(100vh - 28px); overflow: auto; }
    .panel { padding: 14px; }
    .panel + .panel { margin-top: 12px; }
    .panel-title { font-weight: 800; margin-bottom: 10px; }
    input[type="search"] { width: 100%; border: 1px solid var(--line); border-radius: 7px; padding: 9px 10px; font: inherit; }
    button { border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 7px; padding: 8px 10px; font: inherit; cursor: pointer; }
    button:hover, button.active { border-color: var(--accent); background: var(--soft); }
    .segmented { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
    .list { display: grid; gap: 7px; }
    .item { border: 1px solid var(--line); border-radius: 7px; padding: 9px; cursor: pointer; background: #fff; }
    .item:hover, .item.active { border-color: var(--accent); background: var(--soft); }
    .item-title { font-weight: 700; overflow-wrap: anywhere; }
    .item-sub { color: var(--muted); font-size: 13px; margin-top: 3px; }
    .workspace { display: grid; grid-template-rows: minmax(430px, 58vh) auto; gap: 14px; min-width: 0; }
    .graph-shell { position: relative; overflow: hidden; }
    .graph-toolbar { position: absolute; top: 12px; left: 12px; z-index: 2; display: flex; gap: 6px; }
    svg { width: 100%; height: 100%; display: block; background: #fbfcfe; }
    .edge { stroke: #a7b0c0; stroke-width: 1.4; opacity: .72; }
    .edge.strong { stroke: var(--accent); stroke-width: 2.2; opacity: .95; }
    .node text { font-size: 12px; fill: var(--text); pointer-events: none; }
    .node circle, .node rect { stroke: #526070; stroke-width: 1.2; cursor: pointer; }
    .node.zone rect { fill: #e8eef8; }
    .node.entrypoint circle { fill: #dff3ee; }
    .node.module circle { fill: #fff; }
    .node.package rect { fill: #f2efe8; }
    .node.low-signal { opacity: .42; }
    .node.selected circle, .node.selected rect { stroke: var(--accent); stroke-width: 3; }
    .flow { display: grid; gap: 9px; }
    .flow-step { padding: 10px; display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 10px; align-items: start; }
    .depth { color: var(--muted); font-size: 12px; padding-top: 2px; }
    code { background: var(--code); color: #0f3f3a; padding: 2px 6px; border-radius: 5px; font-size: .92em; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; }
    .badge { display: inline-block; font-size: 12px; color: #0f3f3a; background: var(--code); border-radius: 999px; padding: 3px 8px; margin-left: 6px; }
    .signals { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .empty { color: var(--muted); }
    .low-priority { color: var(--warn); }
    @media (max-width: 1050px) { .app { grid-template-columns: 1fr; } .sidebar, .inspector { position: static; max-height: none; } .grid { grid-template-columns: 1fr 1fr; } }
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
  <div class="app">
    <aside class="sidebar">
      <div class="panel">
        <div class="panel-title">Explore</div>
        <input id="search" type="search" placeholder="Search nodes, zones, files">
        <div class="segmented">
          <button class="active" data-filter="all">All</button>
          <button data-filter="runtime">Runtime</button>
          <button data-filter="entrypoint">Entrypoints</button>
          <button data-filter="low">Low priority</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">Reading Path</div>
        <div id="reading-list" class="list"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Ignore Initially</div>
        <div id="ignore-list" class="list"></div>
      </div>
    </aside>
    <main class="workspace">
      <section class="panel graph-shell">
        <div class="graph-toolbar">
          <button id="zoom-in">Zoom +</button>
          <button id="zoom-out">Zoom -</button>
          <button id="reset-view">Reset</button>
        </div>
        <svg id="graph" role="img" aria-label="Architecture graph"></svg>
      </section>
      <section class="panel">
        <div class="panel-title">Execution Flow</div>
        <div id="flow" class="flow"></div>
      </section>
    </main>
    <aside class="inspector">
      <div class="panel">
        <div class="panel-title">Inspector</div>
        <div id="inspector"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Zone Relationships</div>
        <div id="relationships" class="list"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Active Areas</div>
        <div id="timeline" class="list"></div>
      </div>
      <div class="panel">
        <div class="panel-title">Package Map</div>
        <div id="packages" class="list"></div>
      </div>
    </aside>
  </div>
  <script id="repotour-data" type="application/json">${data}</script>
  <script>
    const profile = JSON.parse(document.getElementById('repotour-data').textContent);
    const graph = profile.architectureGraph || { nodes: [], edges: [] };
    const state = { selected: graph.nodes[0]?.id || null, filter: 'all', search: '', zoom: 1, panX: 0, panY: 0 };
    const byId = new Map(graph.nodes.map(node => [node.id, node]));
    const svg = document.getElementById('graph');
    const inspector = document.getElementById('inspector');

    function visibleNodes() {
      const query = state.search.toLowerCase();
      return graph.nodes.filter(node => {
        const matchesSearch = !query || node.label.toLowerCase().includes(query) || node.path.toLowerCase().includes(query) || node.role.toLowerCase().includes(query);
        const matchesFilter = state.filter === 'all' ||
          (state.filter === 'runtime' && !node.lowSignal && ['zone', 'entrypoint', 'module', 'package'].includes(node.kind)) ||
          (state.filter === 'entrypoint' && node.kind === 'entrypoint') ||
          (state.filter === 'low' && node.lowSignal);
        return matchesSearch && matchesFilter;
      });
    }

    function layout(nodes) {
      const zones = nodes.filter(node => node.kind === 'zone');
      const others = nodes.filter(node => node.kind !== 'zone');
      const placed = new Map();
      zones.forEach((node, index) => placed.set(node.id, { x: 150 + (index % 2) * 260, y: 110 + Math.floor(index / 2) * 150 }));
      others.forEach((node, index) => {
        const zoneEdge = graph.edges.find(edge => edge.to === node.id && byId.get(edge.from)?.kind === 'zone');
        const parent = zoneEdge ? placed.get(zoneEdge.from) : null;
        placed.set(node.id, parent ? { x: parent.x + 300 + (index % 2) * 160, y: parent.y + ((index % 5) - 2) * 38 } : { x: 520 + (index % 3) * 210, y: 90 + Math.floor(index / 3) * 82 });
      });
      return placed;
    }

    function renderGraph() {
      const nodes = visibleNodes();
      const visible = new Set(nodes.map(node => node.id));
      const positions = layout(nodes);
      svg.innerHTML = '';
      const root = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      root.setAttribute('transform', 'translate(' + state.panX + ' ' + state.panY + ') scale(' + state.zoom + ')');
      svg.appendChild(root);

      graph.edges.filter(edge => visible.has(edge.from) && visible.has(edge.to)).forEach(edge => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.setAttribute('class', 'edge' + (edge.weight > 3 ? ' strong' : ''));
        root.appendChild(line);
      });

      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node ' + node.kind + (node.lowSignal ? ' low-signal' : '') + (node.id === state.selected ? ' selected' : ''));
        group.setAttribute('transform', 'translate(' + pos.x + ' ' + pos.y + ')');
        group.addEventListener('click', () => selectNode(node.id));
        const shape = document.createElementNS('http://www.w3.org/2000/svg', node.kind === 'zone' || node.kind === 'package' ? 'rect' : 'circle');
        if (shape.tagName === 'rect') {
          shape.setAttribute('x', '-62'); shape.setAttribute('y', '-23'); shape.setAttribute('width', '124'); shape.setAttribute('height', '46'); shape.setAttribute('rx', '7');
        } else {
          shape.setAttribute('r', String(Math.max(18, Math.min(34, node.importance / 3))));
        }
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('y', node.kind === 'zone' || node.kind === 'package' ? '4' : '48');
        text.textContent = compact(node.label, 24);
        group.appendChild(shape);
        group.appendChild(text);
        root.appendChild(group);
      });
      renderInspector();
    }

    function selectNode(id) {
      state.selected = id;
      renderGraph();
    }

    function renderInspector() {
      const node = byId.get(state.selected) || graph.nodes[0];
      if (!node) {
        inspector.innerHTML = '<p class="empty">No graph nodes available.</p>';
        return;
      }
      const outgoing = graph.edges.filter(edge => edge.from === node.id).map(edge => byId.get(edge.to)?.label).filter(Boolean);
      const incoming = graph.edges.filter(edge => edge.to === node.id).map(edge => byId.get(edge.from)?.label).filter(Boolean);
      inspector.innerHTML = '<div class="item-title">' + esc(node.label) + '</div>' +
        '<div class="item-sub">' + esc(node.kind) + ' · importance ' + node.importance + '%</div>' +
        '<p>' + esc(node.role) + '</p>' +
        '<div class="signals"><strong>Why this matters</strong><br>' + esc((node.signals || []).map(signal => signal.label).join('; ') || 'No evidence signals recorded.') + '</div>' +
        '<div class="signals"><strong>Depends on</strong><br>' + esc(outgoing.slice(0, 8).join('; ') || 'No outgoing graph relationships.') + '</div>' +
        '<div class="signals"><strong>Referenced by</strong><br>' + esc(incoming.slice(0, 8).join('; ') || 'No incoming graph relationships.') + '</div>';
    }

    function renderLists() {
      renderList('reading-list', profile.readingPath, item => ({ title: item.title, sub: item.path, id: graph.nodes.find(node => node.path === item.path)?.id }));
      renderList('ignore-list', profile.ignoreGuidance, item => ({ title: item.path, sub: item.reason, id: graph.nodes.find(node => node.path === item.path)?.id, low: true }));
      renderList('relationships', profile.zoneRelationships, item => ({ title: item.from + ' -> ' + item.to, sub: item.kind + ' · ' + item.weight + ' links' }));
      renderList('timeline', profile.timelineSignals, item => ({ title: item.path, sub: item.kind + ' · ' + item.summary }));
      renderList('packages', profile.packageMap.slice(0, 12), item => ({ title: item.name, sub: item.path + ' · centrality ' + item.centrality + '%' }));
      renderFlow();
    }

    function renderFlow() {
      const container = document.getElementById('flow');
      const flow = profile.executionFlows[0];
      if (!flow) {
        container.innerHTML = '<p class="empty">No execution flow could be traced from sampled imports.</p>';
        return;
      }
      container.innerHTML = flow.steps.map((step, index) => '<div class="flow-step" data-path="' + esc(step.path) + '">' +
        '<div class="depth">' + (index + 1) + '</div><div><div class="item-title"><code>' + esc(step.path) + '</code> <span class="badge">' + esc(step.role) + '</span></div>' +
        '<div class="item-sub">' + esc(step.reason) + '</div><div class="signals">' + esc((step.signals || []).map(signal => signal.label).join('; ')) + '</div></div></div>').join('');
      container.querySelectorAll('.flow-step').forEach(element => {
        element.addEventListener('click', () => {
          const node = graph.nodes.find(candidate => candidate.path === element.dataset.path);
          if (node) selectNode(node.id);
        });
      });
    }

    function renderList(id, items, mapItem) {
      const container = document.getElementById(id);
      if (!container) return;
      if (!items || !items.length) {
        container.innerHTML = '<p class="empty">No signals detected.</p>';
        return;
      }
      container.innerHTML = items.map(item => {
        const mapped = mapItem(item);
        return '<div class="item' + (mapped.low ? ' low-priority' : '') + '" data-node="' + esc(mapped.id || '') + '"><div class="item-title">' + esc(mapped.title) + '</div><div class="item-sub">' + esc(mapped.sub || '') + '</div></div>';
      }).join('');
      container.querySelectorAll('.item').forEach(element => {
        element.addEventListener('click', () => {
          if (element.dataset.node) selectNode(element.dataset.node);
        });
      });
    }

    function compact(value, max) { return value.length > max ? value.slice(0, max - 1) + '…' : value; }
    function esc(value) { return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
    document.getElementById('search').addEventListener('input', event => { state.search = event.target.value; renderGraph(); });
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.filter = button.dataset.filter;
      renderGraph();
    }));
    document.getElementById('zoom-in').addEventListener('click', () => { state.zoom = Math.min(1.8, state.zoom + .15); renderGraph(); });
    document.getElementById('zoom-out').addEventListener('click', () => { state.zoom = Math.max(.65, state.zoom - .15); renderGraph(); });
    document.getElementById('reset-view').addEventListener('click', () => { state.zoom = 1; state.panX = 0; state.panY = 0; state.search = ''; document.getElementById('search').value = ''; renderGraph(); });
    document.addEventListener('keydown', event => {
      if (event.key === '/') { event.preventDefault(); document.getElementById('search').focus(); }
      if (event.key === 'Escape') { state.search = ''; document.getElementById('search').value = ''; renderGraph(); }
    });
    renderLists();
    renderGraph();
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
  return JSON.stringify(profile).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}
