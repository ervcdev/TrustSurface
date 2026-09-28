import type { TokenRow, EvidenceResult } from "./types";

/**
 * Token price dispersion: volume-weighted coefficient of variation (CV)
 * across an asset's underlying tokens' prices, as a percentage.
 * CV = weighted stddev / weighted mean. Higher = tokens disagree more on
 * price. Volume-weighted so one illiquid token can't dominate the number.
 */
export function computeDispersion(tokens: TokenRow[]): EvidenceResult<number> {
  const valid = tokens.filter(
    (t) => t.priceUsd !== null && t.volume24hUsd !== null && t.volume24hUsd > 0
  );

  if (valid.length < 2) {
    return {
      computable: false,
      value: null,
      reason: `Fewer than 2 tokens with valid price and volume data (found ${valid.length}).`,
    };
  }

  const totalVolume = valid.reduce((sum, t) => sum + t.volume24hUsd!, 0);
  const weightedMean =
    valid.reduce((sum, t) => sum + t.priceUsd! * t.volume24hUsd!, 0) / totalVolume;

  if (weightedMean === 0) {
    return { computable: false, value: null, reason: "Weighted mean price is zero." };
  }

  const weightedVariance =
    valid.reduce(
      (sum, t) => sum + t.volume24hUsd! * (t.priceUsd! - weightedMean) ** 2,
      0
    ) / totalVolume;
  const weightedStdDev = Math.sqrt(weightedVariance);
  const cv = (weightedStdDev / weightedMean) * 100;

  return {
    computable: true,
    value: Math.round(cv * 100) / 100,
    explanation: `${valid.length} tokens, volume-weighted price CV of ${cv.toFixed(2)}%.`,
  };
}
