import { describe, it, expect } from "vitest";
import { computeMetadataCompleteness } from "../../lib/evidence/metadata-completeness";
import fixture from "../../fixtures/sample-asset.json";
import thinFixture from "../../fixtures/sample-thin-asset.json";

describe("computeMetadataCompleteness", () => {
  it("scores a fully-populated stock at 100%", () => {
    const result = computeMetadataCompleteness(fixture.info, fixture.asset.assetType as "stock");
    expect(result.computable).toBe(true);
    if (result.computable) expect(result.value).toBe(100);
  });

  it("scores a commodity only against universal fields, not stock-only ones", () => {
    const result = computeMetadataCompleteness(thinFixture.info, thinFixture.asset.assetType as "commodity");
    expect(result.computable).toBe(true);
    if (result.computable) expect(result.value).toBe(100);
  });
});
