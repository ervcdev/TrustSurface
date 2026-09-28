import type { TokenRow, EvidenceResult } from "./types";

/**
 * Token concentration: Herfindahl-Hirschman Index (HHI) across tokens'
 * market-cap shares for one asset. Scale: 0-10,000. Below 1,500 = not
 * concentrated, 1,500-2,500 = moderately concentrated, above 2,500 = highly
 * concentrated (US DOJ/FTC merger-guideline thresholds, reused here as a
 * familiar reference point, not a regulatory claim about this market).
 *
 * NOTE: whether this reads as cross-issuer or cross-chain-deployment
 * CONFIRMED 2026-09-26 via check-coverage.ts against the real universe: of
 * 114 assets with ≥2 tokens, 107 (94%) have ≥2 distinct issuers — this
 * reads as issuer concentration for the large majority of the universe,
 * not chain-deployment concentration. Safe to state directly.
 */
export function computeConcentration(tokens: TokenRow[]): EvidenceResult<number> {
  const valid = tokens.filter((t) => t.marketCapUsd !== null && t.marketCapUsd > 0);

  if (valid.length < 2) {
    return {
      computable: false,
      value: null,
      reason: `Fewer than 2 tokens with valid market cap data (found ${valid.length}).`,
    };
  }

  const totalCap = valid.reduce((sum, t) => sum + t.marketCapUsd!, 0);
  const hhi = valid.reduce((sum, t) => {
    const share = (t.marketCapUsd! / totalCap) * 100;
    return sum + share ** 2;
  }, 0);

  return {
    computable: true,
    value: Math.round(hhi),
    explanation: `HHI of ${Math.round(hhi)} across ${valid.length} tokens (0 = fully dispersed, 10,000 = single token).`,
  };
}
