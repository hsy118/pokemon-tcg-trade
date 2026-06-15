import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enrichMissingPurchaseExchangeRates,
  fetchExchangeRateToKrw,
} from "./exchangeRates";
import type { Purchase } from "./types";

const basePurchase: Purchase = {
  id: "purchase-1",
  productName: "Rasing Chaos",
  language: "북미판",
  category: "부스터 박스",
  purchaseDate: "2026-06-14",
  quantity: 1,
  remainingQuantity: 1,
  unitPrice: 309,
  shippingFee: 0,
  taxFee: 0,
  extraFee: 0,
  currency: "USD",
  exchangeRateKrw: null,
  marketplace: "이베이",
  memo: "",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
};

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

  it("fills missing rates for existing foreign purchases", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        usd: {
          krw: 1555.55,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(enrichMissingPurchaseExchangeRates([basePurchase])).resolves.toEqual([
      expect.objectContaining({
        exchangeRateKrw: 1555.55,
      }),
    ]);
  });

  it("keeps purchases unchanged when a missing exchange rate cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(enrichMissingPurchaseExchangeRates([basePurchase])).resolves.toEqual([
      basePurchase,
    ]);
  });
});
