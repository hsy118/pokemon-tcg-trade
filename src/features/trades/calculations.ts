import type {
  Category,
  DashboardSummary,
  InventoryItem,
  InventoryStatus,
  Language,
  MonthlyProfitPoint,
  Purchase,
  RatioPoint,
  Sale,
  SaleResult,
  TradeLedgerItem,
} from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type PurchaseCost = {
  totalProductCost: number;
  totalAcquisitionCost: number;
  effectiveUnitCost: number;
};

export function roundMoney(value: number) {
  return Math.round(value);
}

export function roundRate(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateDaysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
}

export function calculatePurchaseCosts(purchase: Purchase): PurchaseCost {
  const totalProductCost = purchase.unitPrice * purchase.quantity;
  const totalAcquisitionCost =
    totalProductCost + purchase.shippingFee + purchase.taxFee + purchase.extraFee;

  return {
    totalProductCost: roundMoney(totalProductCost),
    totalAcquisitionCost: roundMoney(totalAcquisitionCost),
    effectiveUnitCost:
      purchase.quantity > 0 ? roundMoney(totalAcquisitionCost / purchase.quantity) : 0,
  };
}

export function calculateSaleResult(sale: Sale, purchase: Purchase): SaleResult {
  const { effectiveUnitCost } = calculatePurchaseCosts(purchase);
  const grossSales = sale.unitSalePrice * sale.quantity;
  const netSales = grossSales - sale.shippingFee - sale.platformFee;
  const acquisitionCost = effectiveUnitCost * sale.quantity;
  const netProfit = netSales - acquisitionCost;

  return {
    ...sale,
    grossSales: roundMoney(grossSales),
    netSales: roundMoney(netSales),
    acquisitionCost: roundMoney(acquisitionCost),
    netProfit: roundMoney(netProfit),
    profitRate: acquisitionCost > 0 ? roundRate((netProfit / acquisitionCost) * 100) : 0,
    holdingDays: calculateDaysBetween(purchase.purchaseDate, sale.saleDate),
  };
}

export function getSaleResults(purchases: Purchase[], sales: Sale[]) {
  const purchaseMap = new Map(purchases.map((purchase) => [purchase.id, purchase]));

  return sales
    .map((sale) => {
      const purchase = purchaseMap.get(sale.purchaseId);

      return purchase ? calculateSaleResult(sale, purchase) : null;
    })
    .filter((sale): sale is SaleResult => sale !== null);
}

export function calculateInventory(
  purchases: Purchase[],
  sales: Sale[],
  asOfDate = new Date().toISOString().slice(0, 10),
): InventoryItem[] {
  const soldQuantityByPurchase = sales.reduce<Map<string, number>>((acc, sale) => {
    acc.set(sale.purchaseId, (acc.get(sale.purchaseId) ?? 0) + sale.quantity);
    return acc;
  }, new Map());

  return purchases
    .map((purchase) => {
      const soldQuantity = soldQuantityByPurchase.get(purchase.id) ?? 0;
      const remainingQuantity = Math.max(0, purchase.quantity - soldQuantity);
      const costs = calculatePurchaseCosts(purchase);
      const status: InventoryStatus =
        remainingQuantity === 0
          ? "판매 완료"
          : remainingQuantity === purchase.quantity
            ? "보유중"
            : "일부 판매";

      return {
        ...purchase,
        remainingQuantity,
        ...costs,
        remainingCost: roundMoney(costs.effectiveUnitCost * remainingQuantity),
        holdingDays: calculateDaysBetween(purchase.purchaseDate, asOfDate),
        status,
      };
    })
    .filter((item) => item.remainingQuantity > 0);
}

export function calculateDashboardSummary(
  purchases: Purchase[],
  sales: Sale[],
  asOfDate = new Date().toISOString().slice(0, 10),
): DashboardSummary {
  const totalAcquisitionCost = purchases.reduce(
    (sum, purchase) => sum + calculatePurchaseCosts(purchase).totalAcquisitionCost,
    0,
  );
  const inventory = calculateInventory(purchases, sales, asOfDate);
  const saleResults = getSaleResults(purchases, sales);
  const realizedNetProfit = saleResults.reduce((sum, sale) => sum + sale.netProfit, 0);
  const realizedAcquisitionCost = saleResults.reduce(
    (sum, sale) => sum + sale.acquisitionCost,
    0,
  );
  const totalHoldingDays = saleResults.reduce((sum, sale) => sum + sale.holdingDays, 0);

  return {
    totalAcquisitionCost: roundMoney(totalAcquisitionCost),
    currentInventoryCost: roundMoney(
      inventory.reduce((sum, item) => sum + item.remainingCost, 0),
    ),
    realizedNetProfit: roundMoney(realizedNetProfit),
    realizedProfitRate:
      realizedAcquisitionCost > 0
        ? roundRate((realizedNetProfit / realizedAcquisitionCost) * 100)
        : 0,
    currentQuantity: inventory.reduce((sum, item) => sum + item.remainingQuantity, 0),
    averageHoldingDays:
      saleResults.length > 0 ? roundMoney(totalHoldingDays / saleResults.length) : 0,
  };
}

function averageRateByKey<T extends Language | Category>(
  purchases: Purchase[],
  sales: Sale[],
  getKey: (sale: SaleResult) => T,
): RatioPoint[] {
  const grouped = getSaleResults(purchases, sales).reduce<Map<T, SaleResult[]>>(
    (acc, sale) => {
      const key = getKey(sale);
      const group = acc.get(key) ?? [];
      group.push(sale);
      acc.set(key, group);
      return acc;
    },
    new Map(),
  );

  return Array.from(grouped.entries()).map(([name, items]) => ({
    name,
    value: roundRate(items.reduce((sum, item) => sum + item.profitRate, 0) / items.length),
  }));
}

export function calculateAverageProfitRateByLanguage(
  purchases: Purchase[],
  sales: Sale[],
): RatioPoint[] {
  return averageRateByKey(purchases, sales, (sale) => sale.language);
}

export function calculateAverageProfitRateByCategory(
  purchases: Purchase[],
  sales: Sale[],
): RatioPoint[] {
  return averageRateByKey(purchases, sales, (sale) => sale.category);
}

export function calculateInventoryShareByLanguage(
  purchases: Purchase[],
  sales: Sale[],
  asOfDate?: string,
): RatioPoint[] {
  const inventory = calculateInventory(purchases, sales, asOfDate);
  const totalQuantity = inventory.reduce((sum, item) => sum + item.remainingQuantity, 0);
  const grouped = inventory.reduce<Map<Language, number>>((acc, item) => {
    acc.set(item.language, (acc.get(item.language) ?? 0) + item.remainingQuantity);
    return acc;
  }, new Map());

  if (totalQuantity === 0) {
    return [];
  }

  return Array.from(grouped.entries()).map(([name, quantity]) => ({
    name,
    value: roundRate((quantity / totalQuantity) * 100),
  }));
}

export function calculateMonthlyProfit(
  purchases: Purchase[],
  sales: Sale[],
): MonthlyProfitPoint[] {
  const grouped = getSaleResults(purchases, sales).reduce<Map<string, number>>(
    (acc, sale) => {
      const month = sale.saleDate.slice(0, 7);
      acc.set(month, (acc.get(month) ?? 0) + sale.netProfit);
      return acc;
    },
    new Map(),
  );

  return Array.from(grouped.entries())
    .map(([month, profit]) => ({ month, profit: roundMoney(profit) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getTopProfitSales(purchases: Purchase[], sales: Sale[], limit = 5) {
  return [...getSaleResults(purchases, sales)]
    .sort((a, b) => b.profitRate - a.profitRate)
    .slice(0, limit);
}

export function getLongHoldingInventory(
  purchases: Purchase[],
  sales: Sale[],
  asOfDate?: string,
  limit = 5,
) {
  return [...calculateInventory(purchases, sales, asOfDate)]
    .sort((a, b) => b.holdingDays - a.holdingDays)
    .slice(0, limit);
}

export function getLossSales(purchases: Purchase[], sales: Sale[]) {
  return getSaleResults(purchases, sales).filter((sale) => sale.netProfit < 0);
}

export function buildTradeLedger(
  purchases: Purchase[],
  sales: Sale[],
): TradeLedgerItem[] {
  const saleResults = getSaleResults(purchases, sales).map((sale) => ({
    id: `sale-${sale.id}`,
    date: sale.saleDate,
    type: "판매" as const,
    productName: sale.productName,
    language: sale.language,
    quantity: sale.quantity,
    amount: sale.netSales,
    currency: "KRW" as const,
    profit: sale.netProfit,
    memo: sale.memo,
  }));
  const purchaseItems = purchases.map((purchase) => ({
    id: `purchase-${purchase.id}`,
    date: purchase.purchaseDate,
    type: "구매" as const,
    productName: purchase.productName,
    language: purchase.language,
    quantity: purchase.quantity,
    amount: calculatePurchaseCosts(purchase).totalAcquisitionCost,
    currency: purchase.currency,
    profit: null,
    memo: purchase.memo,
  }));

  return [...saleResults, ...purchaseItems].sort((a, b) => b.date.localeCompare(a.date));
}
