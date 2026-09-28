import {
  RwaListResponse,
  RwaInfoResponse,
  RwaQuotesResponse,
  RwaIssuerListResponse,
  RwaIssuerDetailResponse,
  extractRwaList,
  type RwaListItem,
  type RwaInfo,
  type RwaQuote,
  type RwaIssuerListItem,
  type RwaIssuerDetail,
} from "./types";

const BASE_URL = "https://pro-api.coinmarketcap.com";

function apiKey(): string {
  if (!process.env.CMC_API_KEY) {
    throw new Error(
      "CMC_API_KEY is not set — copy .env.example to .env.local and fill it in."
    );
  }
  return process.env.CMC_API_KEY;
}

async function cmcFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: {
      "X-CMC_PRO_API_KEY": apiKey(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CMC ${path} responded ${res.status}: ${body}`);
  }

  const json = await res.json();

  // error_code has been observed as the string "0" in a real response, not
  // the number 0 — compare as strings so a successful call is never
  // mistaken for an error because of the type mismatch.
  if (String(json?.status?.error_code) !== "0") {
    throw new Error(
      `CMC ${path} error ${json?.status?.error_code}: ${json?.status?.error_message ?? "unknown"}`
    );
  }

  return json;
}

export async function fetchAssetList(
  params: { assetType?: string; start?: number; limit?: number } = {}
): Promise<(RwaListItem & { rwa_id: number })[]> {
  const json = await cmcFetch("/v5/real-world-assets/assets/list", {
    ...(params.assetType ? { asset_type: params.assetType } : {}),
    ...(typeof params.start === "number" ? { start: String(params.start) } : {}),
    ...(typeof params.limit === "number" ? { limit: String(params.limit) } : {}),
  });
  const items = extractRwaList(RwaListResponse.parse(json).data);
  // Drop placeholder rows with no rwa_id (seen live 2026-09-26) — they have
  // no identity to ingest and String(null) would poison the assets table.
  return items.filter((a): a is RwaListItem & { rwa_id: number } => a.rwa_id !== null);
}

export async function fetchInfo(rwaIds: number[]): Promise<RwaInfo[]> {
  const json = await cmcFetch("/v5/real-world-assets/info", {
    rwa_id: rwaIds.join(","),
    skip_invalid: "true",
  });
  return extractRwaList(RwaInfoResponse.parse(json).data);
}

export async function fetchQuotes(rwaIds: number[]): Promise<RwaQuote[]> {
  const json = await cmcFetch("/v5/real-world-assets/quotes/latest", {
    rwa_id: rwaIds.join(","),
    skip_invalid: "true",
  });
  return extractRwaList(RwaQuotesResponse.parse(json).data);
}

/**
 * Issuer endpoints — paths AND field shapes confirmed against live responses
 * 2026-09-26 (issuers/list items: {issuer_id, name, num_tokens, website?,
 * logo?}; issuers detail: issuer object with tokens[] refs in data).
 */
export async function fetchIssuersList(
  params: { start?: number; limit?: number } = {}
): Promise<{ issuers: RwaIssuerListItem[]; totalSize: number; hasMore: boolean }> {
  const json = await cmcFetch("/v5/real-world-assets/issuers/list", {
    ...(typeof params.start === "number" ? { start: String(params.start) } : {}),
    ...(typeof params.limit === "number" ? { limit: String(params.limit) } : {}),
  });
  const parsed = RwaIssuerListResponse.parse(json);
  // Pagination driven by the response's own has_more/total_size (confirmed
  // live 2026-09-26) — never by guessing from the returned page length.
  return { issuers: parsed.data.issuers, totalSize: parsed.data.total_size, hasMore: parsed.data.has_more };
}

export async function fetchIssuer(issuerId: string): Promise<RwaIssuerDetail> {
  const json = await cmcFetch("/v5/real-world-assets/issuers", { issuer_id: issuerId });
  return RwaIssuerDetailResponse.parse(json).data;
}
