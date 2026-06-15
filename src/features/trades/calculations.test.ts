import { describe, expect, it } from "vitest";
import {
  buildTradeLedger,
  calculateAverageProfitRateByCategory,
  calculateAverageProfitRateByLanguage,
  calculateDashboardSummary,
  calculateInventory,
  calculateMonthlyProfit,
  calculatePurchaseCosts,
  calculateSaleResult,
} from "./calculations";
import { CATEGORIES } from "./constants";
import type { Purchase, Sale } from "./types";

const basePurchase: Purchase = {
  id: "purchase-1",
  productName: "White Flare Booster Box",
  language: "북미판",
  category: "부스터 박스",
  purchaseDate: "2026-06-14",
  quantity: 2,
  remainingQuantity: 2,
  unitPrice: 180_000,
  shippingFee: 10_000,
  taxFee: 6_000,
  extraFee: 0,
  currency: "KRW",
  exchangeRateKrw: null,
  marketplace: "포켓몬센터",
  memo: "포켓몬센터 아님",
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
};

const baseSale: Sale = {
  id: "sale-1",
  purchaseId: "purchase-1",
  productName: "White Flare Booster Box",
  language: "북미판",
  category: "부스터 박스",
  saleDate: "2026-07-20",
  quantity: 1,
  unitSalePrice: 230_000,
  shippingFee: 3_000,
  platformFee: 9_000,
  marketplace: "번개장터",
  memo: "번개장터 판매",
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

describe("trade calculations", () => {
  it("supports card and pack variants as trade categories", () => {
    expect(CATEGORIES).toContain("박스(한판/일판)");
    expect(CATEGORIES).toContain("싱글 카드");
    expect(CATEGORIES).toContain("등급 카드");
  });

  it("calculates purchase acquisition cost per box", () => {
    expect(calculatePurchaseCosts(basePurchase)).toEqual({
      totalProductCost: 360_000,
      totalAcquisitionCost: 376_000,
      effectiveUnitCost: 188_000,
    });
  });

  it("calculates sale profit, profit rate, and holding days", () => {
    expect(calculateSaleResult(baseSale, basePurchase)).toMatchObject({
      grossSales: 230_000,
      netSales: 218_000,
      acquisitionCost: 188_000,
      netProfit: 30_000,
      profitRate: 15.96,
      holdingDays: 36,
    });
  });

  it("calculates foreign purchase acquisition cost in KRW for sale profit", () => {
    const usdPurchase: Purchase = {
      ...basePurchase,
      currency: "USD",
      exchangeRateKrw: 1555.55,
      unitPrice: 90,
      shippingFee: 10,
      taxFee: 0,
      quantity: 1,
      remainingQuantity: 1,
    };
    const sale: Sale = {
      ...baseSale,
      quantity: 1,
      unitSalePrice: 180_000,
      shippingFee: 0,
      platformFee: 0,
    };

    expect(calculateSaleResult(sale, usdPurchase)).toMatchObject({
      acquisitionCost: 155_555,
      netProfit: 24_445,
      profitRate: 15.71,
    });
  });

  it("keeps partially sold inventory with remaining cost", () => {
    const inventory = calculateInventory([basePurchase], [baseSale], "2026-07-21");

    expect(inventory).toHaveLength(1);
    expect(inventory[0]).toMatchObject({
      remainingQuantity: 1,
      remainingCost: 188_000,
      status: "일부 판매",
      holdingDays: 37,
    });
  });

  it("summarizes realized profit and current inventory", () => {
    const summary = calculateDashboardSummary([basePurchase], [baseSale], "2026-07-21");

    expect(summary).toEqual({
      totalAcquisitionCost: 376_000,
      currentInventoryCost: 188_000,
      realizedNetProfit: 30_000,
      realizedProfitRate: 15.96,
      currentQuantity: 1,
      averageHoldingDays: 36,
    });
  });

  it("groups average profit rate by language and category", () => {
    const japanesePurchase: Purchase = {
      ...basePurchase,
      id: "purchase-2",
      language: "일본판",
      category: "ETB",
      unitPrice: 100_000,
      shippingFee: 0,
      taxFee: 0,
      quantity: 1,
      remainingQuantity: 1,
    };
    const japaneseSale: Sale = {
      ...baseSale,
      id: "sale-2",
      purchaseId: "purchase-2",
      language: "일본판",
      category: "ETB",
      quantity: 1,
      unitSalePrice: 90_000,
      shippingFee: 0,
      platformFee: 0,
    };

    const purchases = [basePurchase, japanesePurchase];
    const sales = [baseSale, japaneseSale];

    expect(calculateAverageProfitRateByLanguage(purchases, sales)).toEqual([
      { name: "북미판", value: 15.96 },
      { name: "일본판", value: -10 },
    ]);
    expect(calculateAverageProfitRateByCategory(purchases, sales)).toEqual([
      { name: "부스터 박스", value: 15.96 },
      { name: "ETB", value: -10 },
    ]);
  });

  it("groups realized monthly profit and combines purchase/sale ledger", () => {
    expect(calculateMonthlyProfit([basePurchase], [baseSale])).toEqual([
      { month: "2026-07", profit: 30_000 },
    ]);

    expect(buildTradeLedger([basePurchase], [baseSale])).toEqual([
      {
        id: "sale-sale-1",
        date: "2026-07-20",
        type: "판매",
        productName: "White Flare Booster Box",
        language: "북미판",
        quantity: 1,
        amount: 218_000,
        currency: "KRW",
        exchangeRateKrw: null,
        profit: 30_000,
        memo: "번개장터 판매",
      },
      {
        id: "purchase-purchase-1",
        date: "2026-06-14",
        type: "구매",
        productName: "White Flare Booster Box",
        language: "북미판",
        quantity: 2,
        amount: 376_000,
        currency: "KRW",
        exchangeRateKrw: null,
        profit: null,
        memo: "포켓몬센터 아님",
      },
    ]);
  });

  it("keeps purchase currency in the ledger for table rendering", () => {
    const usdPurchase: Purchase = {
      ...basePurchase,
      currency: "USD",
      exchangeRateKrw: 1555.55,
      unitPrice: 120,
      shippingFee: 10,
      taxFee: 0,
    };

    expect(buildTradeLedger([usdPurchase], [])).toEqual([
      expect.objectContaining({
        amount: 250,
        currency: "USD",
        exchangeRateKrw: 1555.55,
      }),
    ]);
  });
});
