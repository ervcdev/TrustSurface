import { describe, it, expect } from "vitest";
import { computeAssetEvidence, buildUniverseShares } from "../../lib/evidence/index";
import fixture from "../../fixtures/sample-asset.json";

describe("computeAssetEvidence", () => {
  it("returns all five evidence results for a well-covered asset", () => {
    const universeShares = buildUniverseShares(fixture.issuersUniverse);
    const evidence = computeAssetEvidence({
      tokens: fixture.tokens,
      info: fixture.info,
      assetType: fixture.asset.assetType as "stock",
      tradfiMarkets: fixture.tradfiMarkets,
      universeShares,
    });

    expect(evidence.dispersion.computable).toBe(true);
    expect(evidence.concentration.computable).toBe(true);
    expect(evidence.issuerExposure.computable).toBe(true);
    expect(evidence.metadataCompleteness.computable).toBe(true);
    expect(evidence.exchangeCoverage.computable).toBe(true);
  });
});
