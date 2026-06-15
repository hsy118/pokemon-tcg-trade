"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";
import {
  mapPurchaseInput,
  mapPurchaseRow,
  mapPurchaseUpdate,
  mapSaleInput,
  mapSaleRow,
  mapSaleUpdate,
} from "./supabaseMappers";
import type { Purchase, Sale } from "./types";

type TradeState = {
  purchases: Purchase[];
  sales: Sale[];
};

const emptyState: TradeState = {
  purchases: [],
  sales: [],
};

function isMissingExchangeRateColumn(error: { message?: string } | null) {
  return Boolean(
    error?.message?.includes("exchange_rate_krw") ||
      error?.message?.includes("schema cache"),
  );
}

function omitExchangeRateColumn<T extends { exchange_rate_krw?: number | null }>(payload: T) {
  const legacyPayload = { ...payload };
  delete legacyPayload.exchange_rate_krw;

  return legacyPayload;
}

export type PurchaseInput = Omit<
  Purchase,
  "id" | "remainingQuantity" | "createdAt" | "updatedAt"
>;

export type SaleInput = Omit<Sale, "id" | "createdAt" | "updatedAt">;

export function useTradeStore() {
  const { user } = useAuth();
  const [state, setState] = useState<TradeState>(emptyState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setState(emptyState);
      setIsHydrated(true);
      return;
    }

    let isCurrent = true;

    const loadTrades = async () => {
      setIsHydrated(false);
      setError(null);

      const [purchasesResult, salesResult] = await Promise.all([
        supabase
          .from("purchases")
          .select("*")
          .order("purchase_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("sales")
          .select("*")
          .order("sale_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (!isCurrent) {
        return;
      }

      if (purchasesResult.error || salesResult.error) {
        setError("거래 데이터를 불러오지 못했습니다.");
        setState(emptyState);
      } else {
        setState({
          purchases: purchasesResult.data.map(mapPurchaseRow),
          sales: salesResult.data.map(mapSaleRow),
        });
      }

      setIsHydrated(true);
    };

    loadTrades().catch(() => {
      if (!isCurrent) {
        return;
      }

      setError("거래 데이터를 불러오지 못했습니다.");
      setState(emptyState);
      setIsHydrated(true);
    });

    return () => {
      isCurrent = false;
    };
  }, [user]);

  const addPurchase = async (input: PurchaseInput) => {
    setIsMutating(true);
    setError(null);

    const payload = mapPurchaseInput(input);
    let insertResult = await supabase
      .from("purchases")
      .insert(payload)
      .select()
      .single();

    if (isMissingExchangeRateColumn(insertResult.error)) {
      insertResult = await supabase
        .from("purchases")
        .insert(omitExchangeRateColumn(payload))
        .select()
        .single();
    }

    setIsMutating(false);

    const { data, error: insertError } = insertResult;

    if (insertError) {
      setError("구매 기록을 저장하지 못했습니다.");
      throw insertError;
    }

    const purchase = mapPurchaseRow(data);
    setState((current) => ({
      ...current,
      purchases: [purchase, ...current.purchases],
    }));

    return purchase;
  };

  const addSale = async (input: SaleInput) => {
    setIsMutating(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("sales")
      .insert(mapSaleInput(input))
      .select()
      .single();

    setIsMutating(false);

    if (insertError) {
      setError("판매 기록을 저장하지 못했습니다.");
      throw insertError;
    }

    const sale = mapSaleRow(data);
    setState((current) => ({
      ...current,
      sales: [sale, ...current.sales],
    }));

    return sale;
  };

  const deletePurchase = async (purchaseId: string) => {
    setIsMutating(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchaseId);

    setIsMutating(false);

    if (deleteError) {
      setError("구매 기록을 삭제하지 못했습니다.");
      throw deleteError;
    }

    setState((current) => ({
      purchases: current.purchases.filter((purchase) => purchase.id !== purchaseId),
      sales: current.sales.filter((sale) => sale.purchaseId !== purchaseId),
    }));
  };

  const updatePurchase = async (purchaseId: string, input: PurchaseInput) => {
    setIsMutating(true);
    setError(null);

    const payload = mapPurchaseUpdate(input);
    let updateResult = await supabase
      .from("purchases")
      .update(payload)
      .eq("id", purchaseId)
      .select()
      .single();

    if (isMissingExchangeRateColumn(updateResult.error)) {
      updateResult = await supabase
        .from("purchases")
        .update(omitExchangeRateColumn(payload))
        .eq("id", purchaseId)
        .select()
        .single();
    }

    setIsMutating(false);

    const { data, error: updateError } = updateResult;

    if (updateError) {
      setError("구매 기록을 수정하지 못했습니다.");
      throw updateError;
    }

    const updatedPurchase = mapPurchaseRow(data);
    setState((current) => ({
      ...current,
      purchases: current.purchases.map((purchase) =>
        purchase.id === purchaseId ? updatedPurchase : purchase,
      ),
    }));

    return updatedPurchase;
  };

  const updateSale = async (saleId: string, input: SaleInput) => {
    setIsMutating(true);
    setError(null);

    const { data, error: updateError } = await supabase
      .from("sales")
      .update(mapSaleUpdate(input))
      .eq("id", saleId)
      .select()
      .single();

    setIsMutating(false);

    if (updateError) {
      setError("판매 기록을 수정하지 못했습니다.");
      throw updateError;
    }

    const updatedSale = mapSaleRow(data);
    setState((current) => ({
      ...current,
      sales: current.sales.map((sale) =>
        sale.id === saleId ? updatedSale : sale,
      ),
    }));

    return updatedSale;
  };

  const deleteSale = async (saleId: string) => {
    setIsMutating(true);
    setError(null);

    const { error: deleteError } = await supabase.from("sales").delete().eq("id", saleId);

    setIsMutating(false);

    if (deleteError) {
      setError("판매 기록을 삭제하지 못했습니다.");
      throw deleteError;
    }

    setState((current) => ({
      ...current,
      sales: current.sales.filter((sale) => sale.id !== saleId),
    }));
  };

  return {
    ...state,
    isHydrated,
    isMutating,
    error,
    addPurchase,
    addSale,
    updatePurchase,
    updateSale,
    deletePurchase,
    deleteSale,
  };
}
