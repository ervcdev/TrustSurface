import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAssetList } from "../../lib/cmc/client";

const originalFetch = global.fetch;

beforeEach(() => {
  vi.stubEnv("CMC_API_KEY", "test-key");
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

function mockFetchOnce(body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  }) as unknown as typeof fetch;
}

const baseStatus = {
  timestamp: "2026-01-01T00:00:00Z",
  error_message: null,
  elapsed: 1,
  credit_count: 1,
};

describe("fetchAssetList — error_code and data-key handling", () => {
  // Regression test: a real response seen in the wild has error_code as the
  // STRING "0", not the number 0. The original check (`!== 0`) would have
  // thrown on every single successful call.
  it("succeeds when error_code is the string \"0\"", async () => {
    mockFetchOnce({
      data: { rwa_assets: [], total_size: 0, has_more: false },
      status: { ...baseStatus, error_code: "0" },
    });
    await expect(fetchAssetList()).resolves.toEqual([]);
  });

  it("still succeeds when error_code is the number 0 (docs' documented shape)", async () => {
    mockFetchOnce({
      data: { rwa_assets: [], total_size: 0, has_more: false },
      status: { ...baseStatus, error_code: 0 },
    });
    await expect(fetchAssetList()).resolves.toEqual([]);
  });

  it("throws with the message when error_code is genuinely non-zero", async () => {
    mockFetchOnce({
      data: {},
      status: { ...baseStatus, error_code: "1002", error_message: "Invalid API key" },
    });
    await expect(fetchAssetList()).rejects.toThrow(/1002/);
  });

  // Regression test: another builder reported the top-level data key
  // flipping between `rwa_assets` and `assets` on the same endpoint.
  it("reads from the assets key when rwa_assets is absent", async () => {
    mockFetchOnce({
      data: {
        assets: [
          {
            rwa_id: 1,
            name: "Test Co",
            symbol: "TST",
            slug: "test-co",
            asset_type: "stock",
            rwa_rank: 1,
            has_tokens: true,
            average_tokenized_price: 100,
            tokenized_market_cap: 1000,
            tokenized_volume_24h: 50,
            last_updated: "2026-01-01T00:00:00Z",
          },
        ],
      },
      status: { ...baseStatus, error_code: "0" },
    });
    const result = await fetchAssetList();
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("TST");
  });

  // Regression test: live response 2026-09-26 contains placeholder rows with
  // rwa_id: null AND has_tokens: null. They must parse without throwing and
  // be dropped before ingest (String(null) === "null" would poison joins).
  it("drops placeholder rows with null rwa_id instead of throwing", async () => {
    mockFetchOnce({
      data: {
        rwa_assets: [
          {
            rwa_id: null,
            name: "Placeholder",
            symbol: "XXX",
            slug: "placeholder",
            asset_type: "stock",
            rwa_rank: 999,
            has_tokens: null,
            average_tokenized_price: null,
            tokenized_market_cap: null,
            tokenized_volume_24h: null,
            last_updated: "2026-01-01T00:00:00Z",
          },
          {
            rwa_id: 1,
            name: "Test Co",
            symbol: "TST",
            slug: "test-co",
            asset_type: "stock",
            rwa_rank: 1,
            has_tokens: true,
            average_tokenized_price: 100,
            tokenized_market_cap: 1000,
            tokenized_volume_24h: 50,
            last_updated: "2026-01-01T00:00:00Z",
          },
        ],
      },
      status: { ...baseStatus, error_code: "0" },
    });
    const result = await fetchAssetList();
    expect(result).toHaveLength(1);
    expect(result[0].rwa_id).toBe(1);
  });
});
