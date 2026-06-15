"use client";

import { useMemo, useState } from "react";
import { BarChart3, PackagePlus, Sparkles, Tag } from "lucide-react";
import { calculateDashboardSummary, calculateInventory } from "./calculations";
import { formatCurrency, formatNumber } from "./formatters";
import {
  InventoryCard,
  InventoryFilters,
  type FilterValue,
  type InventorySort,
} from "./TradeCards";
import type { Category, Language } from "./types";
import { useTradeSheets } from "./useTradeSheets";
import { useTradeStore } from "./useTradeStore";

export function TradesView() {
  const {
    purchases,
    sales,
    error: storeError,
    isHydrated,
    isMutating,
    addPurchase,
    addSale,
    updatePurchase,
    updateSale,
    deletePurchase,
    deleteSale,
  } = useTradeStore();
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryLanguage, setInventoryLanguage] =
    useState<FilterValue<Language>>("전체");
  const [inventoryCategory, setInventoryCategory] =
    useState<FilterValue<Category>>("전체");
  const [inventorySort, setInventorySort] =
    useState<InventorySort>("holdingDaysDesc");

  const inventory = useMemo(() => calculateInventory(purchases, sales), [purchases, sales]);
  const summary = useMemo(
    () => calculateDashboardSummary(purchases, sales),
    [purchases, sales],
  );
  const { openPurchaseSheet, openSaleSheet, sheets } = useTradeSheets({
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
  });

  const filteredInventory = useMemo(() => {
    return [...inventory]
      .filter((item) => {
        const matchesQuery = item.productName
          .toLowerCase()
          .includes(inventoryQuery.toLowerCase());
        const matchesLanguage =
          inventoryLanguage === "전체" || item.language === inventoryLanguage;
        const matchesCategory =
          inventoryCategory === "전체" || item.category === inventoryCategory;

        return matchesQuery && matchesLanguage && matchesCategory;
      })
      .sort((a, b) => {
        if (inventorySort === "costAsc") {
          return a.effectiveUnitCost - b.effectiveUnitCost;
        }

        if (inventorySort === "costDesc") {
          return b.effectiveUnitCost - a.effectiveUnitCost;
        }

        return b.holdingDays - a.holdingDays;
      });
  }, [inventory, inventoryCategory, inventoryLanguage, inventoryQuery, inventorySort]);

  if (!isHydrated) {
    return <div className="empty-state">거래 데이터를 불러오는 중입니다.</div>;
  }

  return (
    <main className="page-stack trades-page">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <span className="brand__eyebrow">
            <Sparkles aria-hidden="true" size={15} />
            Collect, track, sell
          </span>
          <h1>Cardfolio</h1>
          <p>카드 앨범처럼 재고를 훑고, 바로 판매 기록까지 남기는 모바일 장부입니다.</p>
        </div>
        <div className="hero-panel__actions">
          <button
            className="button button--primary button--large"
            disabled={isMutating}
            type="button"
            onClick={() => openPurchaseSheet()}
          >
            <PackagePlus aria-hidden="true" size={19} />
            구매 추가
          </button>
          <button
            className="button button--sale button--large"
            disabled={inventory.length === 0 || isMutating}
            type="button"
            onClick={() => openSaleSheet()}
          >
            <Tag aria-hidden="true" size={19} />
            판매 기록
          </button>
        </div>
      </section>

      {storeError ? <p className="form-error">{storeError}</p> : null}

      <section aria-label="거래 요약" className="quick-stats">
        <div className="stat-card stat-card--accent">
          <span>보유 재고</span>
          <strong>{formatNumber(summary.currentQuantity)}개</strong>
          <small>{formatCurrency(summary.currentInventoryCost)}</small>
        </div>
        <div className="stat-card">
          <span>실현 손익</span>
          <strong>{formatCurrency(summary.realizedNetProfit)}</strong>
          <small>누적 판매 기준</small>
        </div>
        <div className="stat-card">
          <span>거래 기록</span>
          <strong>{formatNumber(purchases.length + sales.length)}건</strong>
          <small>구매와 판매 합산</small>
        </div>
      </section>

      <section className="section section--album">
        <div className="section__header">
          <div>
            <span className="eyebrow-row">
              <BarChart3 aria-hidden="true" size={15} />
              Inventory album
            </span>
            <h2 className="section__title">보유 카드 앨범</h2>
            <p className="section__description">
              판매 가능한 상품을 카드처럼 넘겨보고 바로 판매 처리합니다.
            </p>
          </div>
        </div>
        <InventoryFilters
          query={inventoryQuery}
          language={inventoryLanguage}
          category={inventoryCategory}
          sort={inventorySort}
          onQueryChange={setInventoryQuery}
          onLanguageChange={setInventoryLanguage}
          onCategoryChange={setInventoryCategory}
          onSortChange={setInventorySort}
        />
        {filteredInventory.length === 0 ? (
          <div className="empty-state">조건에 맞는 보유 상품이 없습니다.</div>
        ) : (
          <div aria-label="보유 카드 목록" className="inventory-grid inventory-grid--three-up">
            {filteredInventory.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onSell={openSaleSheet}
                onEdit={openPurchaseSheet}
                onDelete={(purchaseId) => void deletePurchase(purchaseId)}
              />
            ))}
          </div>
        )}
      </section>

      {sheets}
    </main>
  );
}
