import type { AssetInfo, AssetType, EvidenceResult } from "./types";

// Fields that plausibly apply to every asset type vs. stock-specific ones.
// Inferred from the RWA API's field set, not independently confirmed
// field-by-field against CMC docs for every asset_type — spot-check against
// a real commodity/ETF/real-estate response before trusting this split.
const UNIVERSAL_FIELDS = ["website"] as const;
const STOCK_ONLY_FIELDS = [
  "employees",
  "founded",
  "industry",
  "cik",
  "primaryExchange",
] as const;

export function computeMetadataCompleteness(
  info: AssetInfo,
  assetType: AssetType
): EvidenceResult<number> {
  const applicableFields: readonly (keyof AssetInfo)[] =
    assetType === "stock" ? [...UNIVERSAL_FIELDS, ...STOCK_ONLY_FIELDS] : UNIVERSAL_FIELDS;

  const populated = applicableFields.filter((field) => info[field] !== null).length;
  const pct = (populated / applicableFields.length) * 100;

  return {
    computable: true,
    value: Math.round(pct),
    explanation: `${populated}/${applicableFields.length} applicable fields populated.`,
  };
}
