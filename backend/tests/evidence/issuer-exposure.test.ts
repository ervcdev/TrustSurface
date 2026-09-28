import { describe, it, expect } from "vitest";
import { computeIssuerExposure, buildUniverseShares } from "../../lib/evidence/issuer-exposure";
import fixture from "../../fixtures/sample-asset.json";
import thinFixture from "../../fixtures/sample-thin-asset.json";

describe("computeIssuerExposure", () => {
  it("picks the dominant issuer's universe share for a multi-issuer asset", () => {
    const shares = buildUniverseShares(fixture.issuersUniverse);
    const result = computeIssuerExposure(fixture.tokens, shares);
    expect(result.computable).toBe(true);
    if (result.computable) {
      expect(result.value.issuerId).toBe("iss-1");
      expect(result.value.shareOfUniversePct).toBeCloseTo((42 / 69) * 100, 1);
    }
  });

  it("still works for a single-token asset — needs only >=1 token", () => {
    const shares = buildUniverseShares(thinFixture.issuersUniverse);
    const result = computeIssuerExposure(thinFixture.tokens, shares);
    expect(result.computable).toBe(true);
  });

  it("is not computable when no token has an issuer attributed", () => {
    const shares = buildUniverseShares(fixture.issuersUniverse);
    const tokens = [{ cryptoId: 1, symbol: "A", issuerId: null, issuerName: null, priceUsd: 100, marketCapUsd: 100, volume24hUsd: 100 }];
    const result = computeIssuerExposure(tokens, shares);
    expect(result.computable).toBe(false);
  });
});
