import { describe, it, expect } from "vitest";
import { extractRwaList, RwaIssuerListItem } from "../../lib/cmc/types";

describe("extractRwaList", () => {
  it("reads from rwa_assets when present", () => {
    expect(extractRwaList({ rwa_assets: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it("reads from assets when rwa_assets is absent — the reported key inconsistency", () => {
    expect(extractRwaList({ assets: [4, 5] })).toEqual([4, 5]);
  });

  it("prefers rwa_assets when both are present", () => {
    expect(extractRwaList({ rwa_assets: [1], assets: [2] })).toEqual([1]);
  });

  it("returns an empty array when neither key is present", () => {
    expect(extractRwaList({})).toEqual([]);
  });
});

describe("RwaIssuerListItem", () => {
  // Regression test: the field was originally guessed as `token_count`.
  // A real issuers/list call on 2026-09-26 confirmed it's `num_tokens`,
  // and that `website`/`logo` are also present on the wire.
  it("parses a real captured issuers/list entry", () => {
    const real = {
      issuer_id: "6878977dcbbf471de3366e85",
      name: "Backed Assets",
      num_tokens: 1176,
      website: "https://assets.backed.fi/",
      logo: null,
    };
    const parsed = RwaIssuerListItem.parse(real);
    expect(parsed.num_tokens).toBe(1176);
    expect(parsed.name).toBe("Backed Assets");
  });

  it("still parses when website/logo are absent (they're optional)", () => {
    const minimal = { issuer_id: "1", name: "Minimal Issuer", num_tokens: 3 };
    expect(() => RwaIssuerListItem.parse(minimal)).not.toThrow();
  });
});
