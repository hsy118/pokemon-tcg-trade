import {
  CalendarDays,
  Coins,
  Edit3,
  Filter,
  PackageCheck,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { CATEGORIES, LANGUAGES } from "./constants";
import { formatCurrency, formatCurrencyWithKrw, formatNumber } from "./formatters";
import type { Category, InventoryItem, Language, TradeLedgerItem } from "./types";

export type InventorySort = "holdingDaysDesc" | "costDesc" | "costAsc";
export type LedgerTypeFilter = "전체" | "구매" | "판매";
export type LedgerSort = "dateDesc" | "dateAsc";
export type FilterValue<T extends string> = T | "전체";

type SelectOption = string | [string, string];

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option)
            ? option
            : [option, option];

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function InventoryFilters({
  query,
  language,
  category,
  sort,
  onQueryChange,
  onLanguageChange,
  onCategoryChange,
  onSortChange,
}: {
  query: string;
  language: FilterValue<Language>;
  category: FilterValue<Category>;
  sort: InventorySort;
  onQueryChange: (value: string) => void;
  onLanguageChange: (value: FilterValue<Language>) => void;
  onCategoryChange: (value: FilterValue<Category>) => void;
  onSortChange: (value: InventorySort) => void;
}) {
  return (
    <details className="filter-panel" open>
      <summary>
        <Filter aria-hidden="true" size={18} />
        재고 필터
      </summary>
      <div className="filters filters--compact">
        <div className="field field--with-icon">
          <label htmlFor="inventory-query">상품명 검색</label>
          <Search aria-hidden="true" size={17} />
          <input
            id="inventory-query"
            placeholder="White Flare"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <SelectField
          id="inventory-language"
          label="언어판"
          value={language}
          options={["전체", ...LANGUAGES]}
          onChange={(value) => onLanguageChange(value as FilterValue<Language>)}
        />
        <SelectField
          id="inventory-category"
          label="상품군"
          value={category}
          options={["전체", ...CATEGORIES]}
          onChange={(value) => onCategoryChange(value as FilterValue<Category>)}
        />
        <SelectField
          id="inventory-sort"
          label="정렬"
          value={sort}
          options={[
            ["holdingDaysDesc", "보유 기간순"],
            ["costDesc", "원가 높은순"],
            ["costAsc", "원가 낮은순"],
          ]}
          onChange={(value) => onSortChange(value as InventorySort)}
        />
      </div>
    </details>
  );
}

export function LedgerFilters({
  query,
  type,
  language,
  sort,
  fromDate,
  toDate,
  onQueryChange,
  onTypeChange,
  onLanguageChange,
  onSortChange,
  onFromDateChange,
  onToDateChange,
}: {
  query: string;
  type: LedgerTypeFilter;
  language: FilterValue<Language>;
  sort: LedgerSort;
  fromDate: string;
  toDate: string;
  onQueryChange: (value: string) => void;
  onTypeChange: (value: LedgerTypeFilter) => void;
  onLanguageChange: (value: FilterValue<Language>) => void;
  onSortChange: (value: LedgerSort) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}) {
  return (
    <details className="filter-panel">
      <summary>
        <Filter aria-hidden="true" size={18} />
        거래 내역 필터
      </summary>
      <div className="filters filters--compact">
        <div className="field field--with-icon">
          <label htmlFor="ledger-query">상품명 검색</label>
          <Search aria-hidden="true" size={17} />
          <input
            id="ledger-query"
            placeholder="상품명"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <SelectField
          id="ledger-type"
          label="유형"
          value={type}
          options={["전체", "구매", "판매"]}
          onChange={(value) => onTypeChange(value as LedgerTypeFilter)}
        />
        <SelectField
          id="ledger-language"
          label="언어판"
          value={language}
          options={["전체", ...LANGUAGES]}
          onChange={(value) => onLanguageChange(value as FilterValue<Language>)}
        />
        <SelectField
          id="ledger-sort"
          label="정렬"
          value={sort}
          options={[
            ["dateDesc", "최신순"],
            ["dateAsc", "오래된순"],
          ]}
          onChange={(value) => onSortChange(value as LedgerSort)}
        />
        <div className="field">
          <label htmlFor="ledger-from">시작일</label>
          <input
            id="ledger-from"
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ledger-to">종료일</label>
          <input
            id="ledger-to"
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
          />
        </div>
      </div>
    </details>
  );
}

export function InventoryCard({
  item,
  onSell,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  onSell: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (purchaseId: string) => void;
}) {
  return (
    <article aria-label={item.productName} className="inventory-card">
      <div className="inventory-card__header">
        <div>
          <span className="eyebrow-row">
            <ShoppingBag aria-hidden="true" size={15} />
            {item.language} · {item.category}
          </span>
          <h3>{item.productName}</h3>
        </div>
        <span className="badge badge--blue">{item.status}</span>
      </div>
      <div className="inventory-card__stats">
        <span>
          <PackageCheck aria-hidden="true" size={17} />
          보유 {formatNumber(item.remainingQuantity)}개
        </span>
        <span>
          <Coins aria-hidden="true" size={17} />
          개당 원가{" "}
          <strong>
            {formatCurrencyWithKrw(
              item.effectiveUnitCost,
              item.currency,
              item.exchangeRateKrw,
            )}
          </strong>
        </span>
        <span>
          <CalendarDays aria-hidden="true" size={17} />
          {formatNumber(item.holdingDays)}일 보유
        </span>
      </div>
      <div className="inventory-card__cost">
        <span>남은 원가</span>
        <strong>
          {formatCurrencyWithKrw(item.remainingCost, item.currency, item.exchangeRateKrw)}
        </strong>
      </div>
      <div className="card-actions">
        <button
          className="button button--primary"
          type="button"
          aria-label={`${item.productName} 판매 처리`}
          onClick={() => onSell(item)}
        >
          <Tag aria-hidden="true" size={17} />
          판매 처리
        </button>
        <button className="button button--ghost button--icon" type="button" onClick={() => onEdit(item)}>
          <Edit3 aria-hidden="true" size={17} />
          수정
        </button>
        <button
          className="button button--danger button--icon"
          type="button"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 aria-hidden="true" size={17} />
          삭제
        </button>
      </div>
    </article>
  );
}

export function LedgerCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TradeLedgerItem;
  onEdit: (item: TradeLedgerItem) => void;
  onDelete: (item: TradeLedgerItem) => void;
}) {
  const isSale = item.type === "판매";

  return (
    <article aria-label={`${item.type} ${item.productName}`} className="ledger-card">
      <div className="ledger-card__marker" aria-hidden="true">
        {isSale ? <Tag size={18} /> : <ShoppingBag size={18} />}
      </div>
      <div className="ledger-card__body">
        <div className="ledger-card__topline">
          <span className={`badge ${isSale ? "badge--green" : "badge--orange"}`}>
            {item.type}
          </span>
          <span>{item.date}</span>
        </div>
        <h3>{item.productName}</h3>
        <p>
          {item.language} · {formatNumber(item.quantity)}개 ·{" "}
          {formatCurrencyWithKrw(item.amount, item.currency, item.exchangeRateKrw)}
        </p>
        {item.profit !== null ? (
          <strong className={item.profit >= 0 ? "profit-positive" : "profit-negative"}>
            수익 {formatCurrency(item.profit)}
          </strong>
        ) : null}
        {item.memo ? <p className="ledger-card__memo">{item.memo}</p> : null}
        <div className="card-actions card-actions--subtle">
          <button className="button button--ghost button--icon" type="button" onClick={() => onEdit(item)}>
            <Edit3 aria-hidden="true" size={16} />
            수정
          </button>
          <button className="button button--danger button--icon" type="button" onClick={() => onDelete(item)}>
            <Trash2 aria-hidden="true" size={16} />
            삭제
          </button>
        </div>
      </div>
    </article>
  );
}
