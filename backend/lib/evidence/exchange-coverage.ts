import type { TradfiMarket, EvidenceResult } from "./types";

export interface ExchangeCoverage {
  count: number;
  exchanges: string[];
}

/**
 * Exchange coverage: how many crypto exchanges carry a market for this
 * asset. Always computable — an empty list is a real, meaningful zero,
 * not a missing-data case, unlike the other four cards.
 */
export function computeExchangeCoverage(
  markets: TradfiMarket[]
): EvidenceResult<ExchangeCoverage> {
  const uniqueExchanges = [...new Set(markets.map((m) => m.exchangeName))];
  const coverage: ExchangeCoverage = {
    count: uniqueExchanges.length,
    exchanges: uniqueExchanges,
  };

  const explanation =
    coverage.count === 0
      ? "Listed on no crypto exchanges — no discoverable secondary market."
      : coverage.count <= 1
        ? `Listed on only ${coverage.count} exchange — thin discoverability.`
        : `Listed on ${coverage.count} exchanges.`;

  return { computable: true, value: coverage, explanation };
}
