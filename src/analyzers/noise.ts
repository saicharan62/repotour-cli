import type { Analyzer, IgnoreGuidance } from "../types.js";
import { isLowSignalPath } from "../utils/paths.js";
import { confidenceFromScore, scoreSignals, signal, topSignals } from "../utils/signals.js";

export const ignoreGuidanceAnalyzer: Analyzer = {
  name: "ignore-guidance",
  analyze(profile) {
    const guidance: IgnoreGuidance[] = profile.repoZones
      .filter((zone) => isLowSignalPath(zone.path) || ["tests", "fixtures", "examples", "docs"].includes(zone.kind))
      .map((zone) => {
        const signals = topSignals([
          signal(`${zone.kind} zone`, 34),
          zone.importance < 35 ? signal("low architectural importance score", 22) : signal("some architectural activity", -8),
          signal(`${zone.files} files grouped away from runtime path`, Math.min(18, Math.log10(zone.files + 1) * 8)),
        ]);
        const score = scoreSignals(signals);
        return {
          path: zone.path,
          reason: `${zone.label} appears support-oriented and is unlikely to clarify the initial runtime path.`,
          confidence: confidenceFromScore(score),
          signals,
        };
      })
      .sort((a, b) => scoreSignals(b.signals) - scoreSignals(a.signals))
      .slice(0, 8);

    return { ...profile, ignoreGuidance: guidance };
  },
};
