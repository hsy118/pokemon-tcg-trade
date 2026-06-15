import type {
  PurchaseInsert,
  PurchaseRow,
  PurchaseUpdate,
  SaleInsert,
  SaleRow,
  SaleUpdate,
} from "@/lib/supabase";
import type { Category, Currency, Language, Purchase, Sale } from "./types";
import type { PurchaseInput, SaleInput } from "./useTradeStore";

export function mapPurchaseRow(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    productName: row.product_name,
    language: row.language as Language,
    category: row.category as Category,
    purchaseDate: row.purchase_date,
    quantity: Number(row.quantity),
    remainingQuantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    shippingFee: Number(row.shipping_fee),
    taxFee: Number(row.tax_fee),
    extraFee: Number(row.extra_fee),
    currency: row.currency as Currency,
    marketplace: row.marketplace,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPurchaseInput(input: PurchaseInput): PurchaseInsert {
  return {
    product_name: input.productName,
    language: input.language,
    category: input.category,
    purchase_date: input.purchaseDate,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    shipping_fee: input.shippingFee,
    tax_fee: input.taxFee,
    extra_fee: input.extraFee,
    currency: input.currency,
    marketplace: input.marketplace,
    memo: input.memo,
  };
}

export function mapPurchaseUpdate(input: PurchaseInput): PurchaseUpdate {
  return mapPurchaseInput(input);
}

export function mapSaleRow(row: SaleRow): Sale {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productName: row.product_name,
    language: row.language as Language,
    category: row.category as Category,
    saleDate: row.sale_date,
    quantity: Number(row.quantity),
    unitSalePrice: Number(row.unit_sale_price),
    shippingFee: Number(row.shipping_fee),
    platformFee: Number(row.platform_fee),
    marketplace: row.marketplace,
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSaleInput(input: SaleInput): SaleInsert {
  return {
    purchase_id: input.purchaseId,
    product_name: input.productName,
    language: input.language,
    category: input.category,
    sale_date: input.saleDate,
    quantity: input.quantity,
    unit_sale_price: input.unitSalePrice,
    shipping_fee: input.shippingFee,
    platform_fee: input.platformFee,
    marketplace: input.marketplace,
    memo: input.memo,
  };
}

export function mapSaleUpdate(input: SaleInput): SaleUpdate {
  return mapSaleInput(input);
}
