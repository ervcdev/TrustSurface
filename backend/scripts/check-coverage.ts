// Run once: npx tsx scripts/check-coverage.ts
// The day-one gate. Confirms whether the asset universe has enough
// multi-token assets to make the dispersion and concentration cards viable.
// Also checks whether multi-token typically means multi-issuer (the more
// interesting signal) vs one issuer on multiple chains (a liquidity-fragmentation
// signal, different story).
import { config } from "dotenv";
// Monorepo: workspace scripts run with CWD=backend/, env file lives at repo root.
config({ path: "../.env.local" });

import { fetchAssetList, fetchQuotes, fetchIssuersList } from "../lib/cmc/client";

async function main() {
  console.log("── Trust Surface — Day-One Gate ─────────────────────────");

  // Step 1: Asset universe
  const assets = await fetchAssetList({ limit: 200 });
  console.log(`\nAsset universe (top 200 by rwa_rank): ${assets.length} assets`);

  const withTokens = assets.filter((a) => a.has_tokens);
  console.log(`Assets with has_tokens = true: ${withTokens.length}`);

  // Step 2: Token counts via quotes/latest (batched)
  const ids = withTokens.map((a) => a.rwa_id);
  const batches: number[][] = [];
  for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));

  let withTwoPlusTokens = 0;
  let multiIssuerCount = 0;

  for (const batch of batches) {
    const quotes = await fetchQuotes(batch);
    for (const q of quotes) {
      if (q.tokens.length >= 2) {
        withTwoPlusTokens++;
        // Check if the multiple tokens come from different issuers
        const uniqueIssuers = new Set(
          q.tokens.map((t) => t.issuer_id).filter(Boolean)
        );
        if (uniqueIssuers.size >= 2) multiIssuerCount++;
      }
    }
  }

  console.log(`\nAssets with ≥2 tokens: ${withTwoPlusTokens}`);
  console.log(`  ↳ of those, ≥2 distinct issuers: ${multiIssuerCount}`);
  console.log(
    `  ↳ single-issuer multi-chain: ${withTwoPlusTokens - multiIssuerCount}`
  );

  // The gate result
  if (withTwoPlusTokens >= 30) {
    console.log(
      "\n✅  GATE PASSES — dispersion and concentration cards are viable."
    );
  } else {
    console.log(
      "\n⛔  GATE FAILS — fall back to 3-card mode: issuer exposure,",
      "metadata completeness, and exchange coverage only."
    );
  }

  // Step 3: Issuer universe — confirms issuers/list field names before
  // trusting the Zod schema in production.
  console.log("\n── Issuer universe check ─────────────────────────────────");
  try {
    const { issuers } = await fetchIssuersList({ limit: 50 });
    console.log(`issuers/list returned ${issuers.length} issuers (first page).`);
    if (issuers.length > 0) {
      console.log("First issuer sample:", JSON.stringify(issuers[0], null, 2));
      console.log(
        "→ Verify that issuer_id, name, num_tokens match the Zod schema in types.ts.",
        "If not, update RwaIssuerListItem before running the full ingestion."
      );
    }
  } catch (err) {
    console.error("issuers/list call failed:", err);
    console.error(
      "→ Check that the endpoint path and field names in client.ts are correct."
    );
  }

  console.log("\n─────────────────────────────────────────────────────────");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
