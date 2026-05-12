import type { ScoreSignal } from "../../../src/types";

export type ArchitectureCardModel = {
  id: string;
  title: string;
  path: string;
  kind: string;
  role: string;
  importance: number;
  low?: boolean;
  signals?: ScoreSignal[];
};

type Props = {
  card: ArchitectureCardModel;
  selected?: boolean;
  onSelect(id: string): void;
};

export function ArchitectureCard({ card, selected, onSelect }: Props) {
  return (
    <article
      className={`architecture-card cursor-pointer border-l-4 ${selected ? "border-accent shadow" : "border-l-slate-400"} ${card.low ? "opacity-50" : ""}`}
      onClick={() => onSelect(card.id)}
    >
      <div className="flex items-start justify-between gap-2 text-xs text-muted">
        <span>{card.kind}</span>
        <span className="rounded-full bg-[#eef4f3] px-2 py-0.5 text-[#17433f]">{Math.round(card.importance)}%</span>
      </div>
      <div className="mt-1 break-words font-bold">{card.title}</div>
      <div className="mt-1 text-sm text-muted">{card.role}</div>
    </article>
  );
}
