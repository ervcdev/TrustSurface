import type { TokenRow, EvidenceResult } from "./types";

export interface IssuerUniverseShare {
  issuerId: string;
  issuerName: string | null;
  shareOfUniversePct: number;
}

/**
 * Issuer exposure: the largest universe-wide share among the issuers behind
 * this asset's tokens. Sourced from the `issuers` table (populated from
 * CMC's /issuers/list — universe-wide token counts), not reconstructed from
 * this asset's own tokens[] — see AGENTS.md rule 4 / Endpoints.
 *
 * Only needs >=1 token with an attributed issuer, not >=2 — a lower bar
 * than dispersion/concentration (see FRONTEND.md's two-tier fallback).
 */
export function computeIssuerExposure(
  assetTokens: TokenRow[],
  universeShares: Map<string, IssuerUniverseShare>
): EvidenceResult<IssuerUniverseShare> {
  const issuerIds = new Set(
    assetTokens.map((t) => t.issuerId).filter((id): id is string => id !== null)
  );

  if (issuerIds.size === 0) {
    return {
      computable: false,
      value: null,
      reason: "No token in this asset has an attributed issuer.",
    };
  }

  let dominant: IssuerUniverseShare | null = null;
  for (const id of issuerIds) {
    const share = universeShares.get(id);
    if (share && (!dominant || share.shareOfUniversePct > dominant.shareOfUniversePct)) {
      dominant = share;
    }
  }

  if (!dominant) {
    return {
      computable: false,
      value: null,
      reason: "Issuer(s) attributed, but not found in the issuers/list snapshot.",
    };
  }

  return {
    computable: true,
    value: dominant,
    explanation: `${dominant.issuerName ?? dominant.issuerId} accounts for ${dominant.shareOfUniversePct.toFixed(2)}% of all tracked tokens.`,
  };
}

/** Run once per ingestion run, not per asset. */
export function buildUniverseShares(
  issuers: { issuerId: string; issuerName: string | null; tokenCount: number }[]
): Map<string, IssuerUniverseShare> {
  const total = issuers.reduce((sum, i) => sum + i.tokenCount, 0);
  const map = new Map<string, IssuerUniverseShare>();
  for (const issuer of issuers) {
    map.set(issuer.issuerId, {
      issuerId: issuer.issuerId,
      issuerName: issuer.issuerName,
      shareOfUniversePct: total > 0 ? (issuer.tokenCount / total) * 100 : 0,
    });
  }
  return map;
}
