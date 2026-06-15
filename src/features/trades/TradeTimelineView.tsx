"use client";

import { useMemo, useState } from "react";
import { BarChart3, PackagePlus, Sparkles, Tag } from "lucide-react";
import { buildTradeLedger, calculateInventory } from "./calculations";
import {
  LedgerCard,
  LedgerFilters,
  type FilterValue,
  type LedgerSort,
  type LedgerTypeFilter,
} from "./TradeCards";
import type { Language } from "./types";
import { useTradeSheets } from "./useTradeSheets";
import { useTradeStore } from "./useTradeStore";

export function TradeTimelineView() {
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
  const [ledgerQuery, setLedgerQuery] = useState("");
  const [ledgerType, setLedgerType] = useState<LedgerTypeFilter>("전체");
  const [ledgerLanguage, setLedgerLanguage] = useState<FilterValue<Language>>("전체");
  const [ledgerSort, setLedgerSort] = useState<LedgerSort>("dateDesc");
  const [ledgerFromDate, setLedgerFromDate] = useState("");
  const [ledgerToDate, setLedgerToDate] = useState("");

  const inventory = useMemo(() => calculateInventory(purchases, sales), [purchases, sales]);
  const ledger = useMemo(() => buildTradeLedger(purchases, sales), [purchases, sales]);
  const { openPurchaseSheet, openSaleSheet, handleLedgerEdit, handleLedgerDelete, sheets } =
    useTradeSheets({
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

  const filteredLedger = useMemo(() => {
    return ledger
      .filter((item) => {
        const matchesQuery = item.productName
          .toLowerCase()
          .includes(ledgerQuery.toLowerCase());
        const matchesType = ledgerType === "전체" || item.type === ledgerType;
        const matchesLanguage = ledgerLanguage === "전체" || item.language === ledgerLanguage;
        const matchesFrom = !ledgerFromDate || item.date >= ledgerFromDate;
        const matchesTo = !ledgerToDate || item.date <= ledgerToDate;

        return matchesQuery && matchesType && matchesLanguage && matchesFrom && matchesTo;
      })
      .sort((a, b) =>
        ledgerSort === "dateDesc"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date),
      );
  }, [
    ledger,
    ledgerFromDate,
    ledgerLanguage,
    ledgerQuery,
    ledgerSort,
    ledgerToDate,
    ledgerType,
  ]);

  if (!isHydrated) {
    return <div className="empty-state">거래 데이터를 불러오는 중입니다.</div>;
  }

  return (
    <main className="page-stack trades-page">
      <section className="hero-panel hero-panel--compact">
        <div className="hero-panel__copy">
          <span className="brand__eyebrow">
            <Sparkles aria-hidden="true" size={15} />
            Trade history
          </span>
          <h1>거래 타임라인</h1>
          <p>구매와 판매 흐름을 따로 모아 보고, 필요한 기록만 빠르게 수정합니다.</p>
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

      <section className="section">
        <div className="section__header">
          <div>
            <span className="eyebrow-row">
              <BarChart3 aria-hidden="true" size={15} />
              Timeline
            </span>
            <h2 className="section__title">거래 내역</h2>
            <p className="section__description">
              구매와 판매를 카드형 타임라인으로 확인하고 필요한 기록만 빠르게 수정합니다.
            </p>
          </div>
        </div>
        <LedgerFilters
          query={ledgerQuery}
          type={ledgerType}
          language={ledgerLanguage}
          sort={ledgerSort}
          fromDate={ledgerFromDate}
          toDate={ledgerToDate}
          onQueryChange={setLedgerQuery}
          onTypeChange={setLedgerType}
          onLanguageChange={setLedgerLanguage}
          onSortChange={setLedgerSort}
          onFromDateChange={setLedgerFromDate}
          onToDateChange={setLedgerToDate}
        />
        {filteredLedger.length === 0 ? (
          <div className="empty-state">등록된 거래 내역이 없습니다.</div>
        ) : (
          <div className="ledger-timeline">
            {filteredLedger.map((item) => (
              <LedgerCard
                key={item.id}
                item={item}
                onEdit={handleLedgerEdit}
                onDelete={handleLedgerDelete}
              />
            ))}
          </div>
        )}
      </section>

      {sheets}
    </main>
  );
}
