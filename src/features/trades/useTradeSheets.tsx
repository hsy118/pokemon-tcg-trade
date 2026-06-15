"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { fetchExchangeRateToKrw } from "./exchangeRates";
import { toDateInputValue } from "./formatters";
import { validateMarketplace } from "./marketplace";
import { PurchaseSheet, SaleSheet } from "./TradeSheets";
import type {
  Category,
  InventoryItem,
  Language,
  Purchase,
  Sale,
  TradeLedgerItem,
} from "./types";
import type { PurchaseInput, SaleInput } from "./useTradeStore";

type SheetType = "purchase" | "sale" | null;

type UseTradeSheetsParams = {
  purchases: Purchase[];
  sales: Sale[];
  inventory: InventoryItem[];
  isMutating: boolean;
  addPurchase: (input: PurchaseInput) => Promise<Purchase>;
  addSale: (input: SaleInput) => Promise<Sale>;
  updatePurchase: (purchaseId: string, input: PurchaseInput) => Promise<Purchase>;
  updateSale: (saleId: string, input: SaleInput) => Promise<Sale>;
  deletePurchase: (purchaseId: string) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
};

const emptyPurchase: PurchaseInput = {
  productName: "",
  language: "북미판",
  category: "부스터 박스",
  purchaseDate: toDateInputValue(),
  quantity: 1,
  unitPrice: 0,
  shippingFee: 0,
  taxFee: 0,
  extraFee: 0,
  currency: "KRW",
  exchangeRateKrw: null,
  marketplace: "포켓몬센터",
  memo: "",
};

function numberFromForm(formData: FormData, key: string) {
  return Number(formData.get(key) || 0);
}

function stringFromForm(formData: FormData, key: string) {
  return String(formData.get(key) || "");
}

function soldQuantityForPurchase(sales: Sale[], purchaseId: string, ignoredSaleId?: string) {
  return sales
    .filter((sale) => sale.purchaseId === purchaseId && sale.id !== ignoredSaleId)
    .reduce((sum, sale) => sum + sale.quantity, 0);
}

function getMarketplaceResult(formData: FormData) {
  return validateMarketplace(
    stringFromForm(formData, "marketplace"),
    stringFromForm(formData, "marketplaceCustom"),
  );
}

function getPurchaseInput(formData: FormData, marketplace: string): PurchaseInput {
  return {
    productName: stringFromForm(formData, "productName").trim(),
    language: stringFromForm(formData, "language") as Language,
    category: stringFromForm(formData, "category") as Category,
    purchaseDate: stringFromForm(formData, "purchaseDate"),
    quantity: numberFromForm(formData, "quantity"),
    unitPrice: numberFromForm(formData, "unitPrice"),
    shippingFee: numberFromForm(formData, "shippingFee"),
    taxFee: numberFromForm(formData, "taxFee"),
    extraFee: numberFromForm(formData, "extraFee"),
    currency: stringFromForm(formData, "currency") as PurchaseInput["currency"],
    exchangeRateKrw: null,
    marketplace,
    memo: stringFromForm(formData, "memo").trim(),
  };
}

async function withPurchaseExchangeRate(input: PurchaseInput): Promise<PurchaseInput> {
  if (input.currency === "KRW") {
    return {
      ...input,
      exchangeRateKrw: null,
    };
  }

  const exchangeRateKrw = await fetchExchangeRateToKrw(input.currency, input.purchaseDate);

  return {
    ...input,
    exchangeRateKrw,
  };
}

function getSaleInput(formData: FormData, purchase: Purchase, marketplace: string): SaleInput {
  return {
    purchaseId: purchase.id,
    productName: purchase.productName,
    language: purchase.language,
    category: purchase.category,
    saleDate: stringFromForm(formData, "saleDate"),
    quantity: numberFromForm(formData, "quantity"),
    unitSalePrice: numberFromForm(formData, "unitSalePrice"),
    shippingFee: numberFromForm(formData, "shippingFee"),
    platformFee: numberFromForm(formData, "platformFee"),
    marketplace,
    memo: stringFromForm(formData, "memo").trim(),
  };
}

function getLedgerRecordId(itemId: string, prefix: "purchase" | "sale") {
  return itemId.startsWith(`${prefix}-`) ? itemId.replace(`${prefix}-`, "") : null;
}

export function useTradeSheets({
  purchases,
  sales,
  inventory,
  isMutating,
  addPurchase,
  addSale,
  updatePurchase,
  updateSale,
  deletePurchase,
  deleteSale,
}: UseTradeSheetsParams): {
  openPurchaseSheet: (purchase?: Purchase | InventoryItem) => void;
  openSaleSheet: (purchase?: Purchase | InventoryItem, sale?: Sale) => void;
  handleLedgerEdit: (item: TradeLedgerItem) => void;
  handleLedgerDelete: (item: TradeLedgerItem) => void;
  sheets: ReactNode;
} {
  const [sheetType, setSheetType] = useState<SheetType>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [salePurchaseId, setSalePurchaseId] = useState("");

  const selectedSalePurchase = purchases.find(
    (purchase) => purchase.id === salePurchaseId,
  );
  const editingSalePurchase = editingSale
    ? purchases.find((purchase) => purchase.id === editingSale.purchaseId)
    : null;
  const saleOptions = useMemo(() => {
    const optionMap = new Map<string, Purchase>();

    inventory.forEach((item) => optionMap.set(item.id, item));

    if (editingSalePurchase) {
      optionMap.set(editingSalePurchase.id, editingSalePurchase);
    }

    return Array.from(optionMap.values());
  }, [editingSalePurchase, inventory]);

  const openPurchaseSheet = (purchase?: Purchase | InventoryItem) => {
    setFormError(null);
    setEditingPurchase(purchase ?? null);
    setEditingSale(null);
    setSheetType("purchase");
  };

  const openSaleSheet = (purchase?: Purchase | InventoryItem, sale?: Sale) => {
    setFormError(null);
    setEditingSale(sale ?? null);
    setEditingPurchase(null);
    setSalePurchaseId(sale?.purchaseId ?? purchase?.id ?? inventory[0]?.id ?? "");
    setSheetType("sale");
  };

  const closeSheet = () => {
    setSheetType(null);
    setFormError(null);
    setEditingPurchase(null);
    setEditingSale(null);
    setSalePurchaseId("");
  };

  const handlePurchaseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const marketplaceResult = getMarketplaceResult(formData);

    if (marketplaceResult.error) {
      setFormError(marketplaceResult.error);
      return;
    }

    const input = getPurchaseInput(formData, marketplaceResult.value);
    const soldQuantity = editingPurchase
      ? soldQuantityForPurchase(sales, editingPurchase.id)
      : 0;

    if (!input.productName || input.quantity < 1) {
      setFormError("상품명과 구매 수량을 확인해 주세요.");
      return;
    }

    if (editingPurchase && input.quantity < soldQuantity) {
      setFormError(`이미 ${soldQuantity}개가 판매되어 구매 수량을 더 낮출 수 없습니다.`);
      return;
    }

    let inputWithExchangeRate: PurchaseInput;
    try {
      inputWithExchangeRate = await withPurchaseExchangeRate(input);
    } catch {
      setFormError("구매일 기준 환율을 가져오지 못했습니다. 잠시 후 다시 저장해 주세요.");
      return;
    }

    try {
      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, inputWithExchangeRate);
      } else {
        await addPurchase(inputWithExchangeRate);
      }

      closeSheet();
    } catch {
      // useTradeStore가 사용자에게 보여줄 저장 오류 메시지를 관리합니다.
    }
  };

  const handleSaleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const purchase = selectedSalePurchase;

    if (!purchase) {
      setFormError("판매할 보유 상품을 선택해 주세요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const marketplaceResult = getMarketplaceResult(formData);

    if (marketplaceResult.error) {
      setFormError(marketplaceResult.error);
      return;
    }

    const input = getSaleInput(formData, purchase, marketplaceResult.value);
    const soldQuantity = soldQuantityForPurchase(sales, purchase.id, editingSale?.id);
    const availableQuantity = purchase.quantity - soldQuantity;

    if (!input.saleDate || input.quantity < 1 || input.quantity > availableQuantity) {
      setFormError(`판매 수량은 1개 이상, 보유 가능 수량 ${availableQuantity}개 이하로 입력해 주세요.`);
      return;
    }

    try {
      if (editingSale) {
        await updateSale(editingSale.id, input);
      } else {
        await addSale(input);
      }

      closeSheet();
    } catch {
      // useTradeStore가 사용자에게 보여줄 저장 오류 메시지를 관리합니다.
    }
  };

  const handleLedgerEdit = (item: TradeLedgerItem) => {
    const purchaseId = getLedgerRecordId(item.id, "purchase");
    const saleId = getLedgerRecordId(item.id, "sale");

    if (purchaseId) {
      const purchase = purchases.find((current) => current.id === purchaseId);
      if (purchase) {
        openPurchaseSheet(purchase);
      }
    }

    if (saleId) {
      const sale = sales.find((current) => current.id === saleId);
      if (sale) {
        openSaleSheet(undefined, sale);
      }
    }
  };

  const handleLedgerDelete = (item: TradeLedgerItem) => {
    const purchaseId = getLedgerRecordId(item.id, "purchase");
    const saleId = getLedgerRecordId(item.id, "sale");

    if (purchaseId) {
      void deletePurchase(purchaseId);
    }

    if (saleId) {
      void deleteSale(saleId);
    }
  };

  return {
    openPurchaseSheet,
    openSaleSheet,
    handleLedgerEdit,
    handleLedgerDelete,
    sheets: (
      <>
        {sheetType === "purchase" ? (
          <PurchaseSheet
            initialValue={editingPurchase ?? emptyPurchase}
            isEditing={Boolean(editingPurchase)}
            isSaving={isMutating}
            error={formError}
            onClose={closeSheet}
            onSubmit={handlePurchaseSubmit}
          />
        ) : null}

        {sheetType === "sale" ? (
          <SaleSheet
            editingSale={editingSale}
            options={saleOptions}
            selectedPurchase={selectedSalePurchase}
            selectedPurchaseId={salePurchaseId}
            isSaving={isMutating}
            error={formError}
            sales={sales}
            onClose={closeSheet}
            onPurchaseChange={setSalePurchaseId}
            onSubmit={handleSaleSubmit}
          />
        ) : null}
      </>
    ),
  };
}
