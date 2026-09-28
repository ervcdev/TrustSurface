import { z } from "zod";

export const AssetType = z.enum([
  "stock",
  "commodity",
  "currency",
  "government_security",
  "etf",
  "real_estate",
]);

export const RwaListItem = z.object({
  // Live response 2026-09-26: the universe contains placeholder rows with
  // rwa_id: null AND has_tokens: null (no identity, nothing to ingest).
  // Accepted as null here so .parse() survives them; fetchAssetList() drops
  // them before they reach the DB (String(null) === "null" would otherwise
  // create one garbage asset row silently breaking joins).
  rwa_id: z.number().nullable(),
  name: z.string(),
  symbol: z.string(),
  slug: z.string(),
  asset_type: AssetType,
  rwa_rank: z.number(),
  has_tokens: z.boolean().nullable(),
  average_tokenized_price: z.number().nullable(),
  tokenized_market_cap: z.number().nullable(),
  tokenized_volume_24h: z.number().nullable(),
  last_updated: z.string(),
});
export type RwaListItem = z.infer<typeof RwaListItem>;

export const RwaInfo = z.object({
  rwa_id: z.number(),
  name: z.string(),
  symbol: z.string(),
  slug: z.string(),
  asset_type: AssetType,
  rwa_rank: z.number(),
  has_tokens: z.boolean(),
  website: z.string().nullable(),
  employees: z.number().nullable(),
  founded: z.string().nullable(),
  industry: z.string().nullable(),
  cik: z.string().nullable(),
  primary_exchange: z.string().nullable(),
  about: z.object({
    description: z.string().nullable(),
    logo: z.string().nullable(),
    website: z.string().nullable(),
    date_added: z.string(),
  }),
});
export type RwaInfo = z.infer<typeof RwaInfo>;

export const RwaToken = z.object({
  crypto_id: z.number(),
  symbol: z.string().nullable(),
  name: z.string().nullable(),
  issuer_id: z.string().nullable(),
  issuer_name: z.string().nullable(),
  price: z.number().nullable(),
  market_cap: z.number().nullable(),
  volume_24h: z.number().nullable(),
});
export type RwaToken = z.infer<typeof RwaToken>;

export const RwaTradfiMarket = z.object({
  exchange: z.object({
    exchange_id: z.number(),
    name: z.string(),
    slug: z.string(),
  }),
  ticker: z.string(),
  market_url: z.string(),
});
export type RwaTradfiMarket = z.infer<typeof RwaTradfiMarket>;

export const RwaQuote = z.object({
  rwa_id: z.number(),
  name: z.string(),
  symbol: z.string(),
  slug: z.string(),
  asset_type: AssetType,
  rwa_rank: z.number(),
  has_tokens: z.boolean(),
  average_tokenized_price: z.number().nullable(),
  tokenized_market_cap: z.number().nullable(),
  tokenized_volume_24h: z.number().nullable(),
  last_updated: z.string(),
  tokens: z.array(RwaToken),
  tradfi_markets: z.array(RwaTradfiMarket),
});
export type RwaQuote = z.infer<typeof RwaQuote>;

// error_code is confirmed to come back as a STRING ("0"), not a number, in
// at least one live response seen in the wild — z.coerce normalizes either
// shape to a string so the equality check in client.ts is reliable either way.
const ApiStatus = z.object({
  timestamp: z.string(),
  error_code: z.coerce.string(),
  error_message: z.string().nullable(),
  elapsed: z.number(),
  credit_count: z.number(),
  notice: z.string().nullable().optional(),
});

// The top-level data key has been reported (by another builder, not
// independently confirmed here) to come back as `rwa_assets` on some calls
// and `assets` on others. Accepting both is cheap insurance against a
// same-endpoint response-shape flip mid-hackathon; see the extraction
// helper below.
export const RwaListResponse = z.object({
  data: z.object({
    rwa_assets: z.array(RwaListItem).optional(),
    assets: z.array(RwaListItem).optional(),
    total_size: z.number().optional(),
    has_more: z.boolean().optional(),
  }),
  status: ApiStatus,
});

export const RwaInfoResponse = z.object({
  data: z.object({
    rwa_assets: z.array(RwaInfo).optional(),
    assets: z.array(RwaInfo).optional(),
  }),
  status: ApiStatus,
});

export const RwaQuotesResponse = z.object({
  data: z.object({
    rwa_assets: z.array(RwaQuote).optional(),
    assets: z.array(RwaQuote).optional(),
  }),
  status: ApiStatus,
});

/** Reads whichever of `rwa_assets` / `assets` the response actually used. */
export function extractRwaList<T>(data: { rwa_assets?: T[]; assets?: T[] }): T[] {
  return data.rwa_assets ?? data.assets ?? [];
}

// --- Issuer endpoints ---
// Field names CONFIRMED against a live response 2026-09-26 (previously
// inferred). issuers/list items carry num_tokens (not token_count) plus
// website/logo. issuers (detail) returns the issuer object directly in data
// with tokens[] refs shaped {name, symbol, crypto_id, rwa_id}.
export const RwaIssuerListItem = z.object({
  issuer_id: z.string(),
  name: z.string().nullable(),
  num_tokens: z.number(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
});
export type RwaIssuerListItem = z.infer<typeof RwaIssuerListItem>;

export const RwaIssuerListResponse = z.object({
  data: z.object({
    issuers: z.array(RwaIssuerListItem),
    total_size: z.number(),
    has_more: z.boolean(),
  }),
  status: ApiStatus,
});

export const RwaIssuerTokenRef = z.object({
  crypto_id: z.number(),
  symbol: z.string().nullable(),
  rwa_id: z.number().nullable(),
});
export type RwaIssuerTokenRef = z.infer<typeof RwaIssuerTokenRef>;

export const RwaIssuerDetail = z.object({
  issuer_id: z.string(),
  name: z.string().nullable(),
  tokens: z.array(RwaIssuerTokenRef),
});
export type RwaIssuerDetail = z.infer<typeof RwaIssuerDetail>;

export const RwaIssuerDetailResponse = z.object({
  data: RwaIssuerDetail,
  status: ApiStatus,
});
