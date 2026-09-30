import { db } from "@/lib/db";
import { assets, quotes, tokens, issuers, ingestionRuns } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ComparePickers } from "@/components/compare-pickers";
import { CompareView } from "@/components/compare-view";
import { computeAssetEvidence, buildUniverseShares, type IssuerUniverseShare } from "@/lib/evidence";
import type { TokenRow, TradfiMarket, AssetInfo, AssetType } from "@/lib/evidence/types";

export const revalidate = 86400;

async function getLatestRunId(): Promise<number | null> {
  try {
    const row = await db
      .select({ id: ingestionRuns.id })
      .from(ingestionRuns)
      .where(eq(ingestionRuns.status, "success"))
      .orderBy(desc(ingestionRuns.finishedAt))
      .limit(1)
      .then((r) => r[0] ?? null);
    return row?.id ?? null;
  } catch {
    // Build-time without DATABASE_URL, or DB unreachable — fallback UI.
    return null;
  }
}

async function loadAssetForCompare(
  id: string,
  runId: number,
  universeShares: Map<string, IssuerUniverseShare>
) {
  // asset, quote and tokens only depend on `id`/`runId` — fetch in parallel.
  // Explicit columns (no raw JSON): this view renders numbers only, and the
  // per-card drawers live on the Profile page, not here.
  const [asset, quote, tokenRows] = await Promise.all([
    db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({
        priceUsd: quotes.priceUsd,
        marketCapUsd: quotes.marketCapUsd,
        volume24hUsd: quotes.volume24hUsd,
        tradfiMarkets: quotes.tradfiMarkets,
        capturedAt: quotes.capturedAt,
      })
      .from(quotes)
      .where(and(eq(quotes.assetId, id), eq(quotes.ingestionRunId, runId)))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({
        cryptoId: tokens.cryptoId,
        symbol: tokens.symbol,
        issuerId: tokens.issuerId,
        issuerName: tokens.issuerName,
        priceUsd: tokens.priceUsd,
        marketCapUsd: tokens.marketCapUsd,
        volume24hUsd: tokens.volume24hUsd,
      })
      .from(tokens)
      .where(and(eq(tokens.assetId, id), eq(tokens.ingestionRunId, runId))),
  ]);
  if (!asset) return null;

  const normalTokens: TokenRow[] = tokenRows.map((t) => ({
    cryptoId: t.cryptoId,
    symbol: t.symbol,
    issuerId: t.issuerId,
    issuerName: t.issuerName,
    priceUsd: t.priceUsd !== null ? Number(t.priceUsd) : null,
    marketCapUsd: t.marketCapUsd !== null ? Number(t.marketCapUsd) : null,
    volume24hUsd: t.volume24hUsd !== null ? Number(t.volume24hUsd) : null,
  }));

  const meta = asset.metadata as Record<string, unknown> | null;
  const info: AssetInfo = {
    website: (meta?.website as string) ?? null,
    employees: (meta?.employees as number) ?? null,
    founded: (meta?.founded as string) ?? null,
    industry: (meta?.industry as string) ?? null,
    cik: (meta?.cik as string) ?? null,
    primaryExchange: (meta?.primaryExchange as string) ?? null,
  };

  const markets: TradfiMarket[] = ((quote?.tradfiMarkets as unknown[]) ?? []).map(
    (m: unknown) => {
      const obj = m as Record<string, unknown>;
      const ex = obj.exchange as Record<string, unknown>;
      return {
        exchangeId: Number(ex?.exchange_id ?? 0),
        exchangeName: String(ex?.name ?? ""),
      };
    }
  );

  const evidence = computeAssetEvidence({
    tokens: normalTokens,
    info,
    assetType: asset.assetType as AssetType,
    tradfiMarkets: markets,
    universeShares,
  });

  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    evidence,
    capturedAt: quote?.capturedAt
      ? new Date(quote.capturedAt).toISOString()
      : new Date().toISOString(),
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  // The picker options don't depend on which run is latest — fetch both
  // at once. (issuerRows below does depend on runId, so it stays after.)
  // assetOptions guarded: without DATABASE_URL (build-time) the query
  // throws — fall back to [] so the page still collects.
  const [runId, assetOptions] = await Promise.all([
    getLatestRunId(),
    db
      .select({
        id: assets.id,
        symbol: assets.symbol,
        name: assets.name,
        assetType: assets.assetType,
      })
      .from(assets)
      .catch(() => []),
  ]);

  if (!runId) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-sm" style={{ color: "var(--ink-tertiary)" }}>
          No ingestion run completed yet — nothing to compare.
        </p>
      </div>
    );
  }

  // Fixed: query the issuers table directly through Drizzle (typed), not
  // via a raw sql`issuers` template — the earlier version imported the
  // table but never actually used it.
  const issuerRows = await db
    .select({
      issuerId: issuers.issuerId,
      issuerName: issuers.issuerName,
      tokenCount: issuers.tokenCount,
    })
    .from(issuers)
    .where(eq(issuers.ingestionRunId, runId));

  const universeShares = buildUniverseShares(issuerRows);

  const [assetA, assetB] = await Promise.all([
    a ? loadAssetForCompare(a, runId, universeShares) : Promise.resolve(null),
    b ? loadAssetForCompare(b, runId, universeShares) : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink-primary)", letterSpacing: "-0.03em" }}
        >
          Compare
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          Same five signals, side by side. No winner declared.
        </p>
      </div>

      <ComparePickers
        assets={assetOptions}
        currentA={a ?? null}
        currentB={b ?? null}
      />

      {assetA && assetB ? (
        <CompareView assetA={assetA} assetB={assetB} />
      ) : (
        <p
          className="text-sm font-mono text-center py-12"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Select two assets to compare.
        </p>
      )}
    </div>
  );
}
