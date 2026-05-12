import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import type { ArchitectureNodeData } from "./graphModel";

export function ArchitectureNode({ data, selected }: NodeProps<ArchitectureNodeData>) {
  const scale = 0.92 + Math.min(0.28, Math.max(0, data.importance) / 400);
  const heat = Math.max(0, Math.min(100, data.heat));
  return (
    <div
      className={`architecture-node ${selected ? "selected" : ""} ${data.active ? "active" : ""} ${data.past ? "past" : ""} ${data.muted ? "muted" : ""} ${data.lowSignal ? "low-signal" : ""}`}
      style={{
        transform: `scale(${scale})`,
        borderColor: colorFor(data.kind, heat),
        boxShadow: data.active || data.kind === "entrypoint" ? `0 0 0 4px ${colorFor(data.kind, heat)}22, 0 12px 28px ${colorFor(data.kind, heat)}22` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="node-meta">
        <span>{data.kind}</span>
        <span>{Math.round(data.importance)}%</span>
      </div>
      <div className="node-title">{data.label}</div>
      <div className="node-role">{data.role}</div>
      <div className="node-heat" style={{ width: `${heat}%`, background: colorFor(data.kind, heat) }} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function colorFor(kind: string, heat: number): string {
  if (kind === "entrypoint") return "#0f766e";
  if (kind === "orchestrator") return "#315f9b";
  if (kind === "package") return "#8a6b2c";
  if (kind === "hotspot") return heat > 70 ? "#b42318" : "#9a4b3f";
  if (kind === "external-package") return "#697386";
  return "#526070";
}
