import { describe, it, expect } from "vitest";
import { computeDispersion } from "../../lib/evidence/dispersion";
import fixture from "../../fixtures/sample-asset.json";
import thinFixture from "../../fixtures/sample-thin-asset.json";

describe("computeDispersion", () => {
  it("computes a volume-weighted CV for a multi-token asset", () => {
    const result = computeDispersion(fixture.tokens);
    expect(result.computable).toBe(true);
    if (result.computable) {
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(5);
    }
  });

  it("is not computable with fewer than 2 valid tokens", () => {
    const result = computeDispersion(thinFixture.tokens);
    expect(result.computable).toBe(false);
    if (!result.computable) expect(result.reason).toMatch(/fewer than 2/i);
  });

  it("ignores tokens with zero volume", () => {
    const tokens = [
      { cryptoId: 1, symbol: "A", issuerId: null, issuerName: null, priceUsd: 100, marketCapUsd: 1000, volume24hUsd: 0 },
      { cryptoId: 2, symbol: "B", issuerId: null, issuerName: null, priceUsd: 100, marketCapUsd: 1000, volume24hUsd: 500 },
    ];
    const result = computeDispersion(tokens);
    expect(result.computable).toBe(false);
  });
});
