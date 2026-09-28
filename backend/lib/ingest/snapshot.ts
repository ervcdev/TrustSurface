import { eq } from "drizzle-orm";
import { db } from "../db";
import { assets, quotes, tokens, issuers, ingestionRuns } from "../db/schema";
import { fetchAssetList, fetchInfo, fetchQuotes, fetchIssuersList } from "../cmc/client";

// Bounded to the top-ranked assets, not the full ~8,000-asset universe —
// keeps one cron run inside a serverless function's execution window and
// keeps daily credit usage predictable. Raise this once you've confirmed
// your plan's max function duration comfortably covers a bigger batch.
const ASSET_UNIVERSE_SIZE = 300;
const BATCH_SIZE = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function runIngestion(): Promise<{ runId: number; assetsCaptured: number }> {
  const [run] = await db
    .insert(ingestionRuns)
    .values({ status: "running" })
    .returning({ id: ingestionRuns.id });
  const runId = run.id;

  try {
    // 1. Asset universe — upsert (one current row per asset, not per-run history)
    const assetList = await fetchAssetList({ limit: ASSET_UNIVERSE_SIZE });

    for (const item of assetList) {
      await db
        .insert(assets)
        .values({
          id: String(item.rwa_id),
          symbol: item.symbol,
          name: item.name,
          assetType: item.asset_type,
          hasTokens: item.has_tokens ?? false,
          raw: item,
        })
        .onConflictDoUpdate({
          target: assets.id,
          set: {
            symbol: item.symbol,
            name: item.name,
            assetType: item.asset_type,
            hasTokens: item.has_tokens ?? false,
            raw: item,
            updatedAt: new Date(),
          },
        });
    }

    // 2. Metadata — batched fetch, per-row update (each asset's metadata differs)
    const rwaIds = assetList.map((a) => a.rwa_id);
    for (const batch of chunk(rwaIds, BATCH_SIZE)) {
      const infoBatch = await fetchInfo(batch);
      for (const info of infoBatch) {
        await db
          .update(assets)
          .set({
            metadata: {
              website: info.website,
              employees: info.employees,
              founded: info.founded,
              industry: info.industry,
              cik: info.cik,
              primaryExchange: info.primary_exchange,
            },
            updatedAt: new Date(),
          })
          .where(eq(assets.id, String(info.rwa_id)));
      }
    }

    // 3. Quotes + tokens — bulk insert per batch (append-only, no upsert needed)
    for (const batch of chunk(rwaIds, BATCH_SIZE)) {
      const quotesBatch = await fetchQuotes(batch);
      if (quotesBatch.length === 0) continue;

      await db.insert(quotes).values(
        quotesBatch.map((q) => ({
          assetId: String(q.rwa_id),
          ingestionRunId: runId,
          priceUsd: q.average_tokenized_price?.toString() ?? null,
          marketCapUsd: q.tokenized_market_cap?.toString() ?? null,
          volume24hUsd: q.tokenized_volume_24h?.toString() ?? null,
          tradfiMarkets: q.tradfi_markets,
          raw: q,
        }))
      );

      const allTokens = quotesBatch.flatMap((q) =>
        q.tokens.map((t) => ({
          assetId: String(q.rwa_id),
          ingestionRunId: runId,
          cryptoId: t.crypto_id,
          symbol: t.symbol,
          issuerId: t.issuer_id,
          issuerName: t.issuer_name,
          priceUsd: t.price?.toString() ?? null,
          marketCapUsd: t.market_cap?.toString() ?? null,
          volume24hUsd: t.volume_24h?.toString() ?? null,
          raw: t,
        }))
      );

      if (allTokens.length > 0) {
        await db.insert(tokens).values(allTokens);
      }
    }

    // 4. Issuers universe — paginated, bulk insert per page. Pagination
    // follows the response's own has_more flag (confirmed live 2026-09-26).
    let start = 1;
    let hasMore = true;
    while (hasMore) {
      const { issuers: page, hasMore: more } = await fetchIssuersList({ start, limit: 100 });
      if (page.length === 0) break;

      await db.insert(issuers).values(
        page.map((i) => ({
          issuerId: i.issuer_id,
          issuerName: i.name,
          tokenCount: i.num_tokens,
          ingestionRunId: runId,
          raw: i,
        }))
      );

      hasMore = more;
      start += 100;
    }

    await db
      .update(ingestionRuns)
      .set({ status: "success", finishedAt: new Date(), assetsCaptured: assetList.length })
      .where(eq(ingestionRuns.id, runId));

    return { runId, assetsCaptured: assetList.length };
  } catch (err) {
    await db
      .update(ingestionRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(ingestionRuns.id, runId));
    throw err;
  }
}
