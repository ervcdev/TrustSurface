# docs/reflection.md — Trust Surface

*Submission reflection — "Build with CMC: API Hackathon," Real World Assets track.*
*Required: what the API enabled, and where it fell short.*

---

## What the API enabled

**The issuer endpoints changed the product.**
The seven RWA endpoints are not equally visible. `assets/list` and `quotes/latest` appear in CMC's promotional materials; `issuers/list` and `issuers` are only in the full reference docs. Once found, the issuer exposure card became the part of the product with no competitor analog: instead of reconstructing issuer exposure from a single asset's own token list, we read universe-wide token counts directly from CMC. "How much of the entire tokenized universe does this issuer control" has a different answer than "how many of this asset's tokens did this issuer issue" — and the first question is the more useful one for systemic concentration risk.

**`quotes/latest` is denser than it looks.**
The headline fields (`average_tokenized_price`, `tokenized_market_cap`) are what most builders read. The `tokens[]` and `tradfi_markets[]` arrays nested inside each asset's response are where the actual analysis lives. `tokens[]` gives per-issuer price and volume breakdowns that make dispersion and concentration computable without touching any Growth-tier endpoints, at no additional credit cost.

**Metadata fields are a signal, not a gap.**
`info` returns fields like `cik`, `primary_exchange`, `founded`, `industry` with a per-`asset_type` applicability pattern. A tokenized equity with no `cik` on record is a different proposition than one with a complete SEC filing reference. Treating missing fields as a signal — rather than hiding them — turned a data-quality limitation into an evidence card.

---

## Where it fell short

**`market-pairs/list` is Growth-gated, not Startup.**
The original design called for venue-level data from `/v5/real-world-assets/market-pairs/list`. It is documented without a tier restriction on the main RWA landing page, but returns `error_code 1006` with a Startup key. Confirmed independently by another builder in the same event. The fallback (token-level data from `quotes/latest`) is analytically valid, but the discovery required a schema change mid-build.

**Issuer endpoint field names needed a real call to confirm.**
`issuers/list` and `issuers` aren't documented with sample responses in the publicly accessible reference. Field names in our Zod schemas had to be inferred and then verified against a real call. A sample response in the docs would have saved two hours.

**Coverage is uneven across `asset_type`.**
Real estate and currency assets are sparse: fewer tokens, less issuer attribution, frequently no `tradfi_markets` entries. Three of the five cards read "not computable" for a significant subset of those categories. We show the reason explicitly rather than interpolate — but the Compare view is most useful for equities and commodities.

**No historical time series.**
`quotes/latest` is point-in-time. Dispersion and concentration today can't be compared to last week without a continuous pipeline running since then. We accumulate a short series as a free byproduct of the daily cron, but a `/v5/real-world-assets/quotes/historical` endpoint would have made the evidence considerably richer.

---

## Day-one gate — real numbers (2026-09-26, Startup event key)

`npm run gate` against the live API, top 200 by `rwa_rank`:

- **198 assets** returned (2 placeholder rows with `rwa_id: null`, filtered before ingest)
- **160** with `has_tokens = true`
- **114 with ≥2 tokens** — gate passes (needed 30), all five cards stay active
- Of those, **107 multi-issuer**, 7 single-issuer multi-chain

Three response-shape quirks confirmed live and now pinned in `lib/cmc/`:
`error_code` arrives as the string `"0"`, the quotes data key is `rwa_assets`,
and `issuers/list` items carry `num_tokens` (not `token_count`).
A captured sample lives in `fixtures/real-example.json`.
