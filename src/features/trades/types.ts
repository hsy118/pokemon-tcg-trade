import type {
  CATEGORIES,
  CURRENCIES,
  LANGUAGES,
  PURCHASE_MARKETPLACES,
  SALE_MARKETPLACES,
} from "./constants";

export type Language = (typeof LANGUAGES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type PurchaseMarketplace = (typeof PURCHASE_MARKETPLACES)[number];
export type SaleMarketplace = (typeof SALE_MARKETPLACES)[number];

export type Purchase = {
  id: string;
  productName: string;
  language: Language;
  category: Category;
  purchaseDate: string;
  quantity: number;
  remainingQuantity: number;
  unitPrice: number;
  shippingFee: number;
  taxFee: number;
  extraFee: number;
  currency: Currency;
  exchangeRateKrw: number | null;
  marketplace: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  purchaseId: string;
  productName: string;
  language: Language;
  category: Category;
  saleDate: string;
  quantity: number;
  unitSalePrice: number;
  shippingFee: number;
  platformFee: number;
  marketplace: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryStatus = "보유중" | "일부 판매" | "판매 완료";

export type InventoryItem = Purchase & {
  totalProductCost: number;
  totalAcquisitionCost: number;
  effectiveUnitCost: number;
  remainingCost: number;
  holdingDays: number;
  status: InventoryStatus;
};

export type SaleResult = Sale & {
  grossSales: number;
  netSales: number;
  acquisitionCost: number;
  netProfit: number;
  profitRate: number;
  holdingDays: number;
};

export type TradeLedgerItem = {
  id: string;
  date: string;
  type: "구매" | "판매";
  productName: string;
  language: Language;
  quantity: number;
  amount: number;
  currency: Currency;
  exchangeRateKrw: number | null;
  profit: number | null;
  memo: string;
};

export type DashboardSummary = {
  totalAcquisitionCost: number;
  currentInventoryCost: number;
  realizedNetProfit: number;
  realizedProfitRate: number;
  currentQuantity: number;
  averageHoldingDays: number;
};

export type RatioPoint = {
  name: string;
  value: number;
};

export type MonthlyProfitPoint = {
  month: string;
  profit: number;
};
