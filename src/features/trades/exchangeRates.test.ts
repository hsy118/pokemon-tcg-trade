import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchExchangeRateToKrw } from "./exchangeRates";

describe("exchangeRates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the KRW rate for the purchase date and currency", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        usd: {
          krw: 1555.55,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchExchangeRateToKrw("USD", "2026-06-14")).resolves.toBe(1555.55);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2026-06-14/v1/currencies/usd.json",
    );
  });

  it("uses 1 for KRW without calling the exchange rate API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchExchangeRateToKrw("KRW", "2026-06-14")).resolves.toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
