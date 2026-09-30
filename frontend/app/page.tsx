import { db } from "@/lib/db";
import { assets, quotes, tokens, issuers, ingestionRuns } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { AssetTable, type AssetRow } from "@/components/asset-table";
import { CoverageSummary } from "@/components/coverage-summary";
import { computeAssetEvidence, buildUniverseShares } from "@/lib/evidence";
import type { TokenRow, TradfiMarket, AssetInfo, AssetType } from "@/lib/evidence/types";

// Revalidate once a day — matches the cron schedule.
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

export default async function ExplorePage() {
  const runId = await getLatestRunId();

  if (!runId) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-sm" style={{ color: "var(--ink-tertiary)" }}>
          No ingestion run completed yet.
        </p>
        <p className="font-mono text-xs mt-2" style={{ color: "var(--ink-tertiary)" }}>
          Run{" "}
          <code
            className="panel px-2 py-0.5"
            style={{ color: "var(--accent)" }}
          >
            GET /api/cron/ingest
          </code>{" "}
          with your{" "}
          <code className="panel px-2 py-0.5" style={{ color: "var(--accent)" }}>
            CRON_SECRET
          </code>{" "}
          to populate the database.
        </p>
      </div>
    );
  }

  // Three independent queries (each only needs `runId`) — run them in
  // parallel instead of stacking three sequential Neon round trips.
  //
  // assetRows uses LEFT JOIN, not INNER — an asset that hasn't gotten a
  // quote row yet (e.g. mid-ingestion failure) should still show up as
  // "not computable," not disappear silently. Same "evidence, not
  // omission" principle the cards follow.
  const [assetRows, tokenRows, issuerRows] = await Promise.all([
    db
      .select({
        id: assets.id,
        symbol: assets.symbol,
        name: assets.name,
        assetType: assets.assetType,
        metadata: assets.metadata,
        priceUsd: quotes.priceUsd,
        marketCapUsd: quotes.marketCapUsd,
        tradfiMarkets: quotes.tradfiMarkets,
      })
      .from(assets)
      .leftJoin(
        quotes,
        and(eq(quotes.assetId, assets.id), eq(quotes.ingestionRunId, runId))
      ),
    // Explicit columns: tokens.raw (per-token API JSON) is dead weight here —
    // this page only needs the normalized numerics. Smaller payloads =
    // faster renders and fewer chances for a transient fetch to kill the page.
    db
      .select({
        assetId: tokens.assetId,
        cryptoId: tokens.cryptoId,
        symbol: tokens.symbol,
        issuerId: tokens.issuerId,
        issuerName: tokens.issuerName,
        priceUsd: tokens.priceUsd,
        marketCapUsd: tokens.marketCapUsd,
        volume24hUsd: tokens.volume24hUsd,
      })
      .from(tokens)
      .where(eq(tokens.ingestionRunId, runId)),
    db
      .select({
        issuerId: issuers.issuerId,
        issuerName: issuers.issuerName,
        tokenCount: issuers.tokenCount,
      })
      .from(issuers)
      .where(eq(issuers.ingestionRunId, runId)),
  ]);

  // Build token map: assetId → TokenRow[]
  const tokenMap = new Map<string, TokenRow[]>();
  for (const t of tokenRows) {
    const list = tokenMap.get(t.assetId) ?? [];
    list.push({
      cryptoId: t.cryptoId,
      symbol: t.symbol,
      issuerId: t.issuerId,
      issuerName: t.issuerName,
      priceUsd: t.priceUsd !== null ? Number(t.priceUsd) : null,
      marketCapUsd: t.marketCapUsd !== null ? Number(t.marketCapUsd) : null,
      volume24hUsd: t.volume24hUsd !== null ? Number(t.volume24hUsd) : null,
    });
    tokenMap.set(t.assetId, list);
  }

  const universeShares = buildUniverseShares(issuerRows);

  // Build table rows
  const tableRows: AssetRow[] = assetRows.map((a) => {
    const assetTokens = tokenMap.get(a.id) ?? [];
    const info: AssetInfo = {
      website: (a.metadata as Record<string, unknown>)?.website as string | null ?? null,
      employees: (a.metadata as Record<string, unknown>)?.employees as number | null ?? null,
      founded: (a.metadata as Record<string, unknown>)?.founded as string | null ?? null,
      industry: (a.metadata as Record<string, unknown>)?.industry as string | null ?? null,
      cik: (a.metadata as Record<string, unknown>)?.cik as string | null ?? null,
      primaryExchange: (a.metadata as Record<string, unknown>)?.primaryExchange as string | null ?? null,
    };
    const markets = ((a.tradfiMarkets as unknown[]) ?? []).map((m: unknown) => {
      const mObj = m as Record<string, unknown>;
      const ex = mObj.exchange as Record<string, unknown>;
      return {
        exchangeId: Number(ex?.exchange_id ?? 0),
        exchangeName: String(ex?.name ?? ""),
      } as TradfiMarket;
    });

    const ev = computeAssetEvidence({
      tokens: assetTokens,
      info,
      assetType: a.assetType as AssetType,
      tradfiMarkets: markets,
      universeShares,
    });

    const coverage: [boolean, boolean, boolean, boolean, boolean] = [
      ev.dispersion.computable,
      ev.concentration.computable,
      ev.issuerExposure.computable,
      ev.metadataCompleteness.computable,
      ev.exchangeCoverage.computable,
    ];

    const tooltips: [string, string, string, string, string] = [
      ev.dispersion.computable ? `CV ${ev.dispersion.value?.toFixed(2)}%` : ev.dispersion.reason,
      ev.concentration.computable ? `HHI ${ev.concentration.value?.toLocaleString()}` : ev.concentration.reason,
      ev.issuerExposure.computable ? `${ev.issuerExposure.value?.issuerName ?? "?"} — ${ev.issuerExposure.value?.shareOfUniversePct.toFixed(1)}%` : ev.issuerExposure.reason,
      ev.metadataCompleteness.computable ? `${ev.metadataCompleteness.value}% complete` : ev.metadataCompleteness.reason,
      ev.exchangeCoverage.computable ? `${ev.exchangeCoverage.value?.count} exchange${ev.exchangeCoverage.value?.count !== 1 ? "s" : ""}` : "No data",
    ];

    return {
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      assetType: a.assetType,
      priceUsd: a.priceUsd,
      marketCapUsd: a.marketCapUsd,
      tokenCount: assetTokens.length,
      coverage,
      coverageTooltips: tooltips,
    };
  });

  // Universe-level coverage, computed from the same real rows the table
  // renders — so the strip and the table can never disagree.
  const coverageCards = [
    "Price dispersion",
    "Concentration",
    "Issuer exposure",
    "Metadata",
    "Exchange coverage",
  ].map((label, i) => ({
    label,
    computable: tableRows.filter((r) => r.coverage[i]).length,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl mb-2"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-primary)",
            letterSpacing: "-0.03em",
          }}
        >
          Tokenized Real-World Assets
        </h1>
        <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
          Five independent evidence signals per asset.{" "}
          <a href="/methodology" style={{ color: "var(--accent)" }} className="underline">
            How we measure this →
          </a>
        </p>
      </div>
      <CoverageSummary total={tableRows.length} cards={coverageCards} />
      <AssetTable data={tableRows} />
    </div>
  );
}
