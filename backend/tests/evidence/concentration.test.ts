import { describe, it, expect } from "vitest";
import { computeConcentration } from "../../lib/evidence/concentration";
import fixture from "../../fixtures/sample-asset.json";
import thinFixture from "../../fixtures/sample-thin-asset.json";

describe("computeConcentration", () => {
  it("computes HHI for a multi-token asset", () => {
    const result = computeConcentration(fixture.tokens);
    expect(result.computable).toBe(true);
    if (result.computable) {
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThanOrEqual(10000);
    }
  });

  it("returns close to 10,000 for a single dominant token", () => {
    const tokens = [
      { cryptoId: 1, symbol: "A", issuerId: null, issuerName: null, priceUsd: 100, marketCapUsd: 1000, volume24hUsd: 100 },
      { cryptoId: 2, symbol: "B", issuerId: null, issuerName: null, priceUsd: 100, marketCapUsd: 0.0001, volume24hUsd: 100 },
    ];
    const result = computeConcentration(tokens);
    expect(result.computable).toBe(true);
    if (result.computable) expect(result.value).toBeGreaterThan(9990);
  });

  it("is not computable with fewer than 2 tokens", () => {
    const result = computeConcentration(thinFixture.tokens);
    expect(result.computable).toBe(false);
  });
});
