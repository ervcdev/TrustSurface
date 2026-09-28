import { describe, it, expect } from "vitest";
import { computeExchangeCoverage } from "../../lib/evidence/exchange-coverage";
import fixture from "../../fixtures/sample-asset.json";
import thinFixture from "../../fixtures/sample-thin-asset.json";

describe("computeExchangeCoverage", () => {
  it("counts unique exchanges", () => {
    const result = computeExchangeCoverage(fixture.tradfiMarkets);
    expect(result.computable).toBe(true);
    if (result.computable) expect(result.value.count).toBe(2);
  });

  it("is computable even at zero — an empty list is a real answer", () => {
    const result = computeExchangeCoverage(thinFixture.tradfiMarkets);
    expect(result.computable).toBe(true);
    if (result.computable) {
      expect(result.value.count).toBe(0);
      expect(result.explanation).toMatch(/no discoverable/i);
    }
  });
});
