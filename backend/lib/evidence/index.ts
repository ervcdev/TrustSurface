import { computeDispersion } from "./dispersion";
import { computeConcentration } from "./concentration";
import { computeIssuerExposure, type IssuerUniverseShare } from "./issuer-exposure";
import { computeMetadataCompleteness } from "./metadata-completeness";
import { computeExchangeCoverage, type ExchangeCoverage } from "./exchange-coverage";
import type { TokenRow, AssetInfo, AssetType, TradfiMarket, EvidenceResult } from "./types";

export interface AssetEvidence {
  dispersion: EvidenceResult<number>;
  concentration: EvidenceResult<number>;
  issuerExposure: EvidenceResult<IssuerUniverseShare>;
  metadataCompleteness: EvidenceResult<number>;
  exchangeCoverage: EvidenceResult<ExchangeCoverage>;
}

export function computeAssetEvidence(input: {
  tokens: TokenRow[];
  info: AssetInfo;
  assetType: AssetType;
  tradfiMarkets: TradfiMarket[];
  universeShares: Map<string, IssuerUniverseShare>;
}): AssetEvidence {
  return {
    dispersion: computeDispersion(input.tokens),
    concentration: computeConcentration(input.tokens),
    issuerExposure: computeIssuerExposure(input.tokens, input.universeShares),
    metadataCompleteness: computeMetadataCompleteness(input.info, input.assetType),
    exchangeCoverage: computeExchangeCoverage(input.tradfiMarkets),
  };
}

export * from "./types";
export { buildUniverseShares } from "./issuer-exposure";
export type { IssuerUniverseShare } from "./issuer-exposure";
export type { ExchangeCoverage } from "./exchange-coverage";
