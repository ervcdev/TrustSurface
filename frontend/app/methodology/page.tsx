import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const CARDS = [
  {
    id: "dispersion",
    label: "Token Price Dispersion",
    formula: "CV = σ_w / μ_w × 100",
    variables: [
      { name: "σ_w", desc: "Volume-weighted standard deviation of token prices" },
      { name: "μ_w", desc: "Volume-weighted mean of token prices" },
      { name: "weight", desc: "Each token's 24h volume as a share of total volume" },
    ],
    source: "/v5/real-world-assets/quotes/latest → tokens[].price, tokens[].volume_24h",
    needs: "≥ 2 tokens with price and 24h volume > 0",
    why: "A token priced at $101 while another is at $99 looks like noise — unless the $99 token handles 98% of the volume, in which case the $101 token is the outlier. Volume-weighting gives the metric the same gravity the market gives it. The result is expressed as a percentage so it stays comparable across assets with very different absolute price scales.",
    ref: "Coefficient of Variation — a standard relative-dispersion measure used in portfolio analysis and quality control.",
  },
  {
    id: "concentration",
    label: "Token Concentration",
    formula: "HHI = Σ (sᵢ × 100)²",
    variables: [
      { name: "sᵢ", desc: "Token i's share of the asset's total tokenized market cap" },
      { name: "HHI", desc: "Herfindahl-Hirschman Index — ranges 0 (fully dispersed) to 10,000 (single token)" },
    ],
    source: "/v5/real-world-assets/quotes/latest → tokens[].market_cap",
    needs: "≥ 2 tokens with market_cap > 0",
    why: "An asset tokenized entirely by one entity (HHI ≈ 10,000) and an asset spread across five issuers (HHI ≈ 2,000) carry structurally different risk profiles even at identical total market caps. HHI makes that difference a single comparable number.",
    ref: "Herfindahl-Hirschman Index — the standard measure used in US antitrust analysis (DOJ/FTC merger guidelines). Thresholds: < 1,500 = unconcentrated, 1,500–2,500 = moderately concentrated, > 2,500 = highly concentrated. These thresholds are imported as a familiar reference point, not a regulatory claim about tokenized markets.",
    caveat: "Whether this measures cross-issuer or cross-chain-deployment concentration depends on whether multi-token assets here typically mean multiple issuers or one issuer deployed on multiple chains. Run issuers/list against the real universe to confirm before treating HHI as an issuer-concentration metric.",
  },
  {
    id: "issuer-exposure",
    label: "Issuer Exposure",
    formula: "share = (issuer's total token count / universe total token count) × 100",
    variables: [
      { name: "issuer's total", desc: "Number of tokens this issuer has issued across the entire RWA universe (from CMC's issuers/list)" },
      { name: "universe total", desc: "Total tokens across all issuers in the universe snapshot" },
    ],
    source: "/v5/real-world-assets/issuers/list (universe counts) + /v5/real-world-assets/quotes/latest → tokens[].issuer_id (attribution)",
    needs: "≥ 1 token with an attributed issuer_id that appears in the issuers/list universe snapshot",
    why: "This metric is sourced from CMC's universe-wide issuer data, not reconstructed from a single asset's token list. The distinction matters: an issuer holding 40% of all tokenized equities is a systemic fact about the market — not just about this one asset. The card shows the dominant issuer among those attributable to this asset's tokens.",
    ref: "Systemic concentration analysis. Compare: the FSOC's use of market-share thresholds to flag systemically important financial institutions.",
  },
  {
    id: "metadata",
    label: "Metadata Completeness",
    formula: "completeness = (populated fields / applicable fields) × 100",
    variables: [
      { name: "applicable fields", desc: "Fields that CMC's info endpoint defines for this asset_type. Stocks: website, employees, founded, industry, cik, primary_exchange. Other types: website only (other fields are type-specific and not penalized when absent)." },
      { name: "populated", desc: "Fields present and non-null in the response" },
    ],
    source: "/v5/real-world-assets/info",
    needs: "Always computable — 0% is a valid and meaningful result",
    why: "A tokenized equity with no CIK number and no primary exchange on record is a different due-diligence proposition than one with a complete SEC filing reference. Missing fields are not a data gap to hide — they are a signal. The card makes that signal visible rather than treating it as an error state.",
    ref: "EDGAR CIK (Central Index Key) — the identifier used by the SEC to track public company filings. Its presence or absence in CMC's RWA data is itself verifiable.",
  },
  {
    id: "exchange-coverage",
    label: "Exchange Coverage",
    formula: "count of unique exchanges in tradfi_markets[]",
    variables: [
      { name: "tradfi_markets[]", desc: "Array of crypto exchanges carrying a market for this asset, as reported by CMC's quotes/latest endpoint" },
    ],
    source: "/v5/real-world-assets/quotes/latest → tradfi_markets[]",
    needs: "Always computable — 0 exchanges is a valid and meaningful result",
    why: "An asset listed on zero crypto exchanges has no discoverable secondary market for most retail participants, regardless of its tokenized market cap. Exchange coverage is a proxy for secondary-market discoverability — a dimension of accessibility not captured by price or volume.",
    ref: "Secondary market liquidity theory. Compare: exchange listing as a factor in asset accessibility analysis.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-10">
        <h1
          className="text-3xl mb-3"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-primary)",
            letterSpacing: "-0.03em",
          }}
        >
          Methodology
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{ color: "var(--ink-secondary)", fontFamily: "var(--font-sans)" }}
        >
          How we measure what we measure — and why we don&apos;t combine it into a score.
        </p>
      </div>

      <Separator style={{ background: "var(--surface-3)" }} className="mb-10" />

      {/* Cards */}
      <div className="flex flex-col gap-12">
        {CARDS.map((card, i) => (
          <section key={card.id}>
            <div className="flex items-start gap-4 mb-4">
              <span
                className="font-mono text-xs mt-1 shrink-0 w-5"
                style={{ color: "var(--ink-tertiary)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2
                className="text-xl"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {card.label}
              </h2>
            </div>

            <div className="ml-9 flex flex-col gap-5">
              {/* Formula */}
              <div
                className="panel p-4 font-mono text-sm"
                style={{ color: "var(--ink-primary)" }}
              >
                {card.formula}
              </div>

              {/* Variables */}
              <div className="flex flex-col gap-2">
                {card.variables.map((v) => (
                  <div key={v.name} className="flex gap-3">
                    <span
                      className="font-mono text-xs shrink-0 w-24 pt-0.5"
                      style={{ color: "var(--accent)" }}
                    >
                      {v.name}
                    </span>
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      {v.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Source & needs */}
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <span
                    className="font-mono text-xs shrink-0 pt-0.5"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    Source
                  </span>
                  <span
                    className="font-mono text-xs leading-relaxed"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {card.source}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span
                    className="font-mono text-xs shrink-0 pt-0.5"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    Needs
                  </span>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {card.needs}
                  </span>
                </div>
              </div>

              {/* Why */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--ink-primary)" }}
              >
                {card.why}
              </p>

              {/* Ref */}
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--ink-tertiary)" }}
              >
                {card.ref}
              </p>

              {/* Caveat if any */}
              {card.caveat && (
                <p
                  className="text-xs leading-relaxed panel p-3"
                  style={{ color: "var(--flag)", background: "var(--flag-surface)" }}
                >
                  ⚠ {card.caveat}
                </p>
              )}
            </div>

            {i < CARDS.length - 1 && (
              <Separator style={{ background: "var(--surface-3)" }} className="mt-12" />
            )}
          </section>
        ))}
      </div>

      {/* Why no composite score */}
      <Separator style={{ background: "var(--surface-3)" }} className="mt-12 mb-10" />
      <section className="mb-12">
        <h2
          className="text-xl mb-5"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Why no composite score
        </h2>
        <div
          className="flex flex-col gap-4 text-sm leading-relaxed"
          style={{ color: "var(--ink-primary)" }}
        >
          <p>
            Combining five independent signals into one number requires choosing weights.
            Any weights we choose are arbitrary — issuer exposure at 40% of the universe
            might matter more than thin exchange coverage for an equity investor, and
            the reverse for a DeFi protocol assessing collateral eligibility. We don&apos;t
            know your mandate, your jurisdiction, or your risk tolerance.
          </p>
          <p>
            A composite score would also hide the cases where signals disagree. An asset
            with perfect metadata, strong exchange coverage, and 95% issuer concentration
            in one entity looks &ldquo;average&rdquo; in a weighted total — but the concentration
            signal is systemically important and shouldn&apos;t be averaged away.
          </p>
          <p style={{ color: "var(--ink-secondary)" }}>
            Trust Surface shows you what we can measure. What it means for your decision
            is yours to decide.
          </p>
        </div>
      </section>

      <div className="text-center">
        <Link
          href="/"
          className="text-sm underline"
          style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
        >
          ← Back to Explore
        </Link>
      </div>
    </div>
  );
}
