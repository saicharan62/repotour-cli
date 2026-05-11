import type { ScoreSignal } from "../types.js";

export function signal(label: string, weight: number): ScoreSignal {
  return { label, weight };
}

export function scoreSignals(signals: ScoreSignal[], cap = 100): number {
  return Math.max(0, Math.min(cap, Math.round(signals.reduce((total, item) => total + item.weight, 0))));
}

export function confidenceFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 78) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function topSignals(signals: ScoreSignal[], limit = 5): ScoreSignal[] {
  const byLabel = new Map<string, ScoreSignal>();
  for (const item of signals) {
    const existing = byLabel.get(item.label);
    if (!existing || Math.abs(item.weight) > Math.abs(existing.weight)) byLabel.set(item.label, item);
  }
  return [...byLabel.values()].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, limit);
}
