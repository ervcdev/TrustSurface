import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { assets, quotes, tokens, issuers, ingestionRuns } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { EvidenceCard } from "@/components/evidence-card";
import { DispersionChart, ConcentrationChart } from "@/components/evidence-charts";
import { computeAssetEvidence, buildUniverseShares } from "@/lib/evidence";
import type { TokenRow, TradfiMarket, AssetInfo, AssetType } from "@/lib/evidence/types";

export const revalidate = 86400;

// Pre-generate static params for the most-ranked assets at build time.
// Returns [] when the DB is unreachable (build without DATABASE_URL) —
// on-demand rendering handles those paths at runtime.
export async function generateStaticParams() {
  try {
    const rows = await db
      .select({ id: assets.id })
      .from(assets)
      .limit(50);
    return rows.map((r) => ({ id: r.id }));
  } catch {
    return [];
  }
}

const TYPE_LABELS: Record<string, string> = {
  stock: "Equity",
  commodity: "Commodity",
  currency: "Currency",
  government_security: "Government Security",
  etf: "ETF",
  real_estate: "Real Estate",
};

export default async function AssetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Latest successful run
  let lastRun = null;
  try {
    lastRun = await db
      .select({ id: ingestionRuns.id })
      .from(ingestionRuns)
      .where(eq(ingestionRuns.status, "success"))
      .orderBy(desc(ingestionRuns.finishedAt))
      .limit(1)
      .then((r) => r[0] ?? null);
  } catch {
    notFound();
  }

  if (!lastRun) notFound();

  const runId = lastRun.id;

  // These four queries don't depend on each other (only on `id` and
  // `runId`, both already known) — run them in parallel. With Neon's HTTP
  // driver every query is its own round trip, so sequential awaits stack
  // latency; Promise.all pays it once. Trade-off: a nonexistent id now
  // costs four cheap queries before the 404 instead of one — 404s are rare.
  const [asset, quote, tokenRows, issuerRows] = await Promise.all([
    db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(quotes)
      .where(and(eq(quotes.assetId, id), eq(quotes.ingestionRunId, runId)))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(tokens)
      .where(and(eq(tokens.assetId, id), eq(tokens.ingestionRunId, runId))),
    db
      .select({
        issuerId: issuers.issuerId,
        issuerName: issuers.issuerName,
        tokenCount: issuers.tokenCount,
      })
      .from(issuers)
      .where(eq(issuers.ingestionRunId, runId)),
  ]);

  if (!asset) notFound();

  const universeShares = buildUniverseShares(issuerRows);

  // Normalise data
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
      return { exchangeId: Number(ex?.exchange_id ?? 0), exchangeName: String(ex?.name ?? "") };
    }
  );

  const ev = computeAssetEvidence({
    tokens: normalTokens,
    info,
    assetType: asset.assetType as AssetType,
    tradfiMarkets: markets,
    universeShares,
  });

  const capturedAt = quote?.capturedAt
    ? new Date(quote.capturedAt).toISOString()
    : new Date().toISOString();

  const priceUsd = quote?.priceUsd ? Number(quote.priceUsd) : null;
  const capUsd = quote?.marketCapUsd ? Number(quote.marketCapUsd) : null;
  const vol24h = quote?.volume24hUsd ? Number(quote.volume24hUsd) : null;

  function fmt(n: number | null, prefix = "$"): string {
    if (n === null) return "—";
    if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(2)}K`;
    return `${prefix}${n.toFixed(2)}`;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs font-mono underline"
          style={{ color: "var(--ink-tertiary)" }}
        >
          ← Explore
        </Link>
      </div>

      {/* Asset header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <h1
              className="text-3xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-primary)",
                letterSpacing: "-0.04em",
              }}
            >
              {asset.symbol}
            </h1>
            <span
              className="text-xs font-mono px-2 py-0.5 panel"
              style={{ color: "var(--ink-secondary)" }}
            >
              {TYPE_LABELS[asset.assetType] ?? asset.assetType}
            </span>
          </div>
          <p className="text-base" style={{ color: "var(--ink-secondary)" }}>
            {asset.name}
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-tertiary)" }}>
            {normalTokens.length} underlying token{normalTokens.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Headline numbers */}
        <div className="flex gap-6">
          {[
            { label: "Avg price", value: fmt(priceUsd) },
            { label: "Tokenized cap", value: fmt(capUsd) },
            { label: "24h volume", value: fmt(vol24h) },
          ].map(({ label, value }) => (
            <div key={label} className="text-right">
              <p
                className="display-number text-xl"
                style={{ color: "var(--ink-primary)" }}
              >
                {value}
              </p>
              <p className="text-xs font-mono" style={{ color: "var(--ink-tertiary)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Compare CTA */}
      <div className="mb-8">
        <Link
          href={`/compare?a=${asset.id}`}
          className="text-xs font-mono underline"
          style={{ color: "var(--accent)" }}
        >
          Compare with another asset →
        </Link>
      </div>

      {/* Evidence cards — asymmetric layout */}
      {/* Row A: Dispersion + Concentration (2 large) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <EvidenceCard
          label="Token Price Dispersion"
          value={ev.dispersion.computable ? `${ev.dispersion.value?.toFixed(2)}%` : undefined}
          explanation={ev.dispersion.computable ? ev.dispersion.explanation : undefined}
          nullReason={!ev.dispersion.computable ? ev.dispersion.reason : undefined}
          size="lg"
          chartSlot={
            <DispersionChart
              data={normalTokens
                .filter((t) => t.priceUsd !== null && t.symbol)
                .map((t) => ({ symbol: t.symbol as string, price: t.priceUsd as number }))}
            />
          }
          raw={{
            endpoint: "/v5/real-world-assets/quotes/latest",
            params: { rwa_id: asset.id },
            capturedAt,
            data: quote?.raw,
          }}
        />
        <EvidenceCard
          label="Token Concentration (HHI)"
          value={
            ev.concentration.computable
              ? ev.concentration.value?.toLocaleString("en-US")
              : undefined
          }
          explanation={ev.concentration.computable ? ev.concentration.explanation : undefined}
          nullReason={!ev.concentration.computable ? ev.concentration.reason : undefined}
          size="lg"
          chartSlot={
            <ConcentrationChart
              data={normalTokens
                .filter((t) => t.marketCapUsd !== null && t.marketCapUsd > 0 && t.symbol)
                .map((t) => ({ symbol: t.symbol as string, marketCap: t.marketCapUsd as number }))}
            />
          }
          raw={{
            endpoint: "/v5/real-world-assets/quotes/latest",
            params: { rwa_id: asset.id },
            capturedAt,
            data: quote?.raw,
          }}
        />
      </div>

      {/* Row B: Issuer + Metadata + Exchange (3 medium) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <EvidenceCard
          label="Issuer Exposure"
          value={
            ev.issuerExposure.computable
              ? `${ev.issuerExposure.value?.shareOfUniversePct.toFixed(1)}%`
              : undefined
          }
          explanation={ev.issuerExposure.computable ? ev.issuerExposure.explanation : undefined}
          nullReason={!ev.issuerExposure.computable ? ev.issuerExposure.reason : undefined}
          raw={{
            endpoint: "/v5/real-world-assets/issuers/list",
            capturedAt,
            data: issuerRows,
          }}
        />
        <EvidenceCard
          label="Metadata Completeness"
          value={
            ev.metadataCompleteness.computable
              ? `${ev.metadataCompleteness.value}%`
              : undefined
          }
          explanation={ev.metadataCompleteness.computable ? ev.metadataCompleteness.explanation : undefined}
          nullReason={!ev.metadataCompleteness.computable ? ev.metadataCompleteness.reason : undefined}
          raw={{
            endpoint: "/v5/real-world-assets/info",
            params: { rwa_id: asset.id },
            capturedAt,
            data: asset.raw,
          }}
        />
        <EvidenceCard
          label="Exchange Coverage"
          value={
            ev.exchangeCoverage.computable
              ? `${ev.exchangeCoverage.value?.count} exchange${ev.exchangeCoverage.value?.count !== 1 ? "s" : ""}`
              : undefined
          }
          explanation={ev.exchangeCoverage.computable ? ev.exchangeCoverage.explanation : undefined}
          nullReason={!ev.exchangeCoverage.computable ? ev.exchangeCoverage.reason : undefined}
          raw={{
            endpoint: "/v5/real-world-assets/quotes/latest",
            params: { rwa_id: asset.id },
            capturedAt,
            data: quote?.raw,
          }}
        />
      </div>

      {/* Methodology link */}
      <p className="mt-8 text-xs font-mono text-right" style={{ color: "var(--ink-tertiary)" }}>
        <Link href="/methodology" className="underline" style={{ color: "var(--accent)" }}>
          How these metrics are calculated →
        </Link>
      </p>
    </div>
  );
}
