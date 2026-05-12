import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import { ArchitectureNode } from "../graph/ArchitectureNode";
import { buildExplorerGraph } from "../graph/graphModel";
import { useExplorerStore } from "../state/explorerStore";
import type { UiMode } from "../types/profile";

const nodeTypes = { architecture: ArchitectureNode };

export function ArchitectureCanvas() {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner />
    </ReactFlowProvider>
  );
}

function ArchitectureCanvasInner() {
  const {
    profile,
    mode,
    focus,
    overlay,
    query,
    selectedId,
    tourIndex,
    traversalPlaying,
    hideLowSignal,
    select,
    startTour,
    setTourIndex,
    setTraversalPlaying,
    toggleLowSignal,
  } = useExplorerStore();
  const reactFlow = useReactFlow();

  const graph = useMemo(() => {
    if (!profile) return { nodes: [], edges: [] };
    return buildExplorerGraph(profile, {
      mode,
      focus,
      overlay,
      query,
      hideLowSignal,
      activeTraversalIndex: traversalPlaying || mode === "learning" ? tourIndex : -1,
    });
  }, [focus, hideLowSignal, mode, overlay, profile, query, tourIndex, traversalPlaying]);

  useEffect(() => {
    window.setTimeout(() => reactFlow.fitView({ padding: 0.18, duration: 650 }), 60);
  }, [mode, overlay, query, focus, hideLowSignal, reactFlow]);

  useEffect(() => {
    if (!traversalPlaying || !profile) return;
    const max = mode === "learning" ? profile.readingPath.length : profile.executionFlows[0]?.steps.length ?? 0;
    if (max <= 1) return;
    const timer = window.setInterval(() => {
      setTourIndex((tourIndex + 1) % max);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [mode, profile, setTourIndex, tourIndex, traversalPlaying]);

  if (!profile) return null;

  return (
    <section className="grid gap-3">
      <div className="rounded-panel border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{titleFor(mode)}</h2>
            <p className="text-sm text-muted">{copyFor(mode)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-panel border border-line px-3 py-2 hover:border-accent" onClick={startTour}>
              Take a Tour
            </button>
            <button
              className={`rounded-panel border px-3 py-2 hover:border-accent ${traversalPlaying ? "border-accent bg-[#e5f3f1]" : "border-line"}`}
              onClick={() => setTraversalPlaying(!traversalPlaying)}
            >
              {traversalPlaying ? "Pause Flow" : "Play Flow"}
            </button>
            <button className="rounded-panel border border-line px-3 py-2 hover:border-accent" onClick={toggleLowSignal}>
              {hideLowSignal ? "Reveal Support" : "Hide Support"}
            </button>
          </div>
        </div>
      </div>

      <div className="architecture-surface">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.25}
          maxZoom={1.7}
          onNodeClick={(_, node) => select(node.id)}
          onPaneClick={() => select(undefined)}
          nodesDraggable
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#d9dee8" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => node.id === selectedId ? "#0f766e" : node.data?.lowSignal ? "#c4cad5" : "#526070"}
            nodeStrokeWidth={3}
          />
          <Panel position="top-left" className="flow-panel">
            <div className="text-xs font-bold uppercase tracking-wide text-muted">{modeLabel(mode)}</div>
            <div className="mt-1 text-sm text-muted">{graph.nodes.length} nodes · {graph.edges.length} relationships · overlay: {overlay}</div>
          </Panel>
        </ReactFlow>
      </div>
    </section>
  );
}

function titleFor(mode: UiMode): string {
  return mode === "runtime" ? "Runtime Traversal" : mode === "package" ? "Package Topology" : mode === "learning" ? "Learning Journey" : "Hotspot Heatmap";
}

function copyFor(mode: UiMode): string {
  return mode === "runtime"
    ? "Animated execution flow from startup into orchestration and runtime modules."
    : mode === "package"
      ? "Workspace boundaries and ownership relationships, optimized for monorepos."
      : mode === "learning"
        ? "A staged onboarding path that reveals the repository in the order you should read it."
        : "Operational pressure points: central modules, active churn, and coordination-heavy files.";
}

function modeLabel(mode: UiMode): string {
  return mode === "runtime" ? "Execution Lens" : mode === "package" ? "Ownership Lens" : mode === "learning" ? "Onboarding Lens" : "Activity Lens";
}
