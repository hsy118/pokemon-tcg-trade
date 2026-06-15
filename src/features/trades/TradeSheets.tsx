import { useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ClipboardList, PackagePlus, Tag, X } from "lucide-react";
import {
  CATEGORIES,
  CURRENCIES,
  LANGUAGES,
  PURCHASE_MARKETPLACES,
  SALE_MARKETPLACES,
} from "./constants";
import { calculatePurchaseCosts } from "./calculations";
import { formatCurrency, formatNumber, toDateInputValue } from "./formatters";
import {
  CUSTOM_MARKETPLACE_OPTION,
  getMarketplaceCustomValue,
  getMarketplaceSelectValue,
  MARKETPLACE_MAX_LENGTH,
} from "./marketplace";
import type { Purchase, Sale } from "./types";
import type { PurchaseInput } from "./useTradeStore";

const SALE_PICKER_RESULT_LIMIT = 20;

function TextInput({
  label,
  name,
  type = "text",
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string | number;
  min?: number;
  max?: number;
}) {
  const id = `${name}-${label}`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        min={min}
        max={max}
        defaultValue={defaultValue}
      />
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly T[];
  defaultValue: T;
}) {
  const id = `${name}-${label}`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function MarketplaceInput<T extends string>({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: readonly T[];
  defaultValue: string;
}) {
  const defaultSelectValue = getMarketplaceSelectValue(defaultValue, options);
  const [selectedMarketplace, setSelectedMarketplace] = useState(defaultSelectValue);
  const customDefaultValue = getMarketplaceCustomValue(defaultValue, options);

  return (
    <>
      <div className="field">
        <label htmlFor={`${label}-marketplace`}>{label}</label>
        <select
          id={`${label}-marketplace`}
          name="marketplace"
          value={selectedMarketplace}
          onChange={(event) => setSelectedMarketplace(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {selectedMarketplace === CUSTOM_MARKETPLACE_OPTION ? (
        <div className="field">
          <label htmlFor={`${label}-marketplace-custom`}>{label} 직접 입력</label>
          <input
            defaultValue={customDefaultValue}
            id={`${label}-marketplace-custom`}
            maxLength={MARKETPLACE_MAX_LENGTH}
            name="marketplaceCustom"
            placeholder="예: 아마존, 카드샵, 문방구"
          />
          <span className="field__hint">최대 {MARKETPLACE_MAX_LENGTH}자</span>
        </div>
      ) : null}
    </>
  );
}

function getAvailableQuantity(purchase: Purchase, sales: Sale[], ignoredSaleId?: string) {
  const soldQuantity = sales
    .filter((sale) => sale.purchaseId === purchase.id && sale.id !== ignoredSaleId)
    .reduce((sum, sale) => sum + sale.quantity, 0);

  return purchase.quantity - soldQuantity;
}

function getSalePurchaseSearchText(purchase: Purchase) {
  return [
    purchase.productName,
    purchase.language,
    purchase.category,
    purchase.marketplace,
    purchase.purchaseDate,
  ]
    .join(" ")
    .toLowerCase();
}

function SalePurchasePicker({
  options,
  selectedPurchase,
  selectedPurchaseId,
  sales,
  ignoredSaleId,
  onPurchaseChange,
}: {
  options: Purchase[];
  selectedPurchase?: Purchase;
  selectedPurchaseId: string;
  sales: Sale[];
  ignoredSaleId?: string;
  onPurchaseChange: (purchaseId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    const matches = normalizedQuery
      ? options.filter((purchase) =>
          getSalePurchaseSearchText(purchase).includes(normalizedQuery),
        )
      : options;

    return matches.slice(0, SALE_PICKER_RESULT_LIMIT);
  }, [normalizedQuery, options]);

  const handleSelect = (purchaseId: string) => {
    onPurchaseChange(purchaseId);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" && filteredOptions[0]) {
      event.preventDefault();
      handleSelect(filteredOptions[0].id);
    }
  };

  return (
    <div className="field span-2 sale-purchase-picker">
      <label htmlFor="sale-purchase-search">판매 상품 검색</label>
      <input
        aria-controls="sale-purchase-results"
        aria-expanded={isOpen}
        autoComplete="off"
        id="sale-purchase-search"
        placeholder="상품명, 언어판, 구매처로 검색"
        role="combobox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {selectedPurchase ? (
        <div className="sale-purchase-selected">
          <span>선택됨</span>
          <strong>{selectedPurchase.productName}</strong>
          <small>
            {selectedPurchase.language} · {selectedPurchase.category} ·{" "}
            {selectedPurchase.purchaseDate}
          </small>
        </div>
      ) : null}
      {isOpen ? (
        <div className="sale-purchase-results" id="sale-purchase-results" role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((purchase) => {
              const cost = calculatePurchaseCosts(purchase).effectiveUnitCost;
              const available = getAvailableQuantity(purchase, sales, ignoredSaleId);
              const isSelected = purchase.id === selectedPurchaseId;

              return (
                <button
                  aria-selected={isSelected}
                  className="sale-purchase-option"
                  key={purchase.id}
                  role="option"
                  type="button"
                  onClick={() => handleSelect(purchase.id)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <span>
                    <strong>{purchase.productName}</strong>
                    <small>
                      {purchase.language} · {purchase.category} · {purchase.purchaseDate}
                    </small>
                  </span>
                  <span>
                    보유 {formatNumber(available)}개 · 원가{" "}
                    {formatCurrency(cost, purchase.currency)}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="sale-purchase-empty">검색 결과가 없습니다.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PurchaseSheet({
  initialValue,
  isEditing,
  isSaving,
  error,
  onClose,
  onSubmit,
}: {
  initialValue: Purchase | PurchaseInput;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const costs = calculatePurchaseCosts({
    ...initialValue,
    id: "preview",
    remainingQuantity: initialValue.quantity,
    createdAt: "",
    updatedAt: "",
  });

  return (
    <div className="sheet-backdrop" role="presentation">
      <div aria-labelledby="purchase-sheet-title" aria-modal="true" className="sheet" role="dialog">
        <button
          aria-label="구매 등록 시트 닫기"
          className="sheet__close"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" size={20} />
        </button>
        <div className="sheet__header">
          <span className="sheet__icon">
            <PackagePlus aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="brand__eyebrow">Add to Cardfolio</p>
            <h2 id="purchase-sheet-title">{isEditing ? "구매 수정하기" : "구매 등록하기"}</h2>
            <p>배송비, 관세, 수수료까지 포함해서 실제 원가를 기록합니다.</p>
          </div>
        </div>
        <form aria-label="구매 등록 폼" onSubmit={onSubmit}>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="form-grid">
            <TextInput label="상품명" name="productName" defaultValue={initialValue.productName} />
            <SelectInput
              label="언어판"
              name="language"
              options={LANGUAGES}
              defaultValue={initialValue.language}
            />
            <SelectInput
              label="상품군"
              name="category"
              options={CATEGORIES}
              defaultValue={initialValue.category}
            />
            <TextInput
              label="구매일"
              name="purchaseDate"
              type="date"
              defaultValue={initialValue.purchaseDate}
            />
            <TextInput
              label="구매 수량"
              name="quantity"
              type="number"
              min={1}
              defaultValue={initialValue.quantity}
            />
            <TextInput
              label="개당 구매가"
              name="unitPrice"
              type="number"
              min={0}
              defaultValue={initialValue.unitPrice}
            />
            <TextInput
              label="배송비"
              name="shippingFee"
              type="number"
              min={0}
              defaultValue={initialValue.shippingFee}
            />
            <TextInput
              label="관세"
              name="taxFee"
              type="number"
              min={0}
              defaultValue={initialValue.taxFee}
            />
            <TextInput
              label="기타 수수료"
              name="extraFee"
              type="number"
              min={0}
              defaultValue={initialValue.extraFee}
            />
            <SelectInput
              label="통화"
              name="currency"
              options={CURRENCIES}
              defaultValue={initialValue.currency}
            />
            <MarketplaceInput
              label="구매처"
              options={PURCHASE_MARKETPLACES}
              defaultValue={initialValue.marketplace}
            />
            <div className="field span-2">
              <label htmlFor="purchase-memo">메모</label>
              <textarea id="purchase-memo" name="memo" defaultValue={initialValue.memo} />
            </div>
          </div>
          <div className="sheet-summary">
            <ClipboardList aria-hidden="true" size={19} />
            <span>총 매입 원가 {formatCurrency(costs.totalAcquisitionCost, initialValue.currency)}</span>
            <strong>개당 {formatCurrency(costs.effectiveUnitCost, initialValue.currency)}</strong>
          </div>
          <div className="sheet__footer">
            <button className="button button--ghost" type="button" onClick={onClose}>
              취소
            </button>
            <button className="button button--primary" disabled={isSaving} type="submit">
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SaleSheet({
  editingSale,
  options,
  selectedPurchase,
  selectedPurchaseId,
  isSaving,
  error,
  sales,
  onClose,
  onPurchaseChange,
  onSubmit,
}: {
  editingSale: Sale | null;
  options: Purchase[];
  selectedPurchase?: Purchase;
  selectedPurchaseId: string;
  isSaving: boolean;
  error: string | null;
  sales: Sale[];
  onClose: () => void;
  onPurchaseChange: (purchaseId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const availableQuantity = selectedPurchase
    ? getAvailableQuantity(selectedPurchase, sales, editingSale?.id)
    : 0;
  const unitCost = selectedPurchase ? calculatePurchaseCosts(selectedPurchase).effectiveUnitCost : 0;

  return (
    <div className="sheet-backdrop" role="presentation">
      <div aria-labelledby="sale-sheet-title" aria-modal="true" className="sheet" role="dialog">
        <button
          aria-label="판매 등록 시트 닫기"
          className="sheet__close"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" size={20} />
        </button>
        <div className="sheet__header">
          <span className="sheet__icon sheet__icon--sale">
            <Tag aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="brand__eyebrow">Mark as sold</p>
            <h2 id="sale-sheet-title">{editingSale ? "판매 수정하기" : "판매 기록하기"}</h2>
            <p>선택한 보유 상품의 판매가와 수수료를 기록해 수익을 계산합니다.</p>
          </div>
        </div>
        <form aria-label="판매 등록 폼" onSubmit={onSubmit}>
          <input name="purchaseId" type="hidden" value={selectedPurchaseId} readOnly />
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="form-grid">
            <SalePurchasePicker
              ignoredSaleId={editingSale?.id}
              options={options}
              sales={sales}
              selectedPurchase={selectedPurchase}
              selectedPurchaseId={selectedPurchaseId}
              onPurchaseChange={onPurchaseChange}
            />
            <TextInput
              label="판매일"
              name="saleDate"
              type="date"
              defaultValue={editingSale?.saleDate ?? toDateInputValue()}
            />
            <TextInput
              label="판매 수량"
              name="quantity"
              type="number"
              min={1}
              max={availableQuantity}
              defaultValue={editingSale?.quantity ?? 1}
            />
            <TextInput
              label="개당 판매가"
              name="unitSalePrice"
              type="number"
              min={0}
              defaultValue={editingSale?.unitSalePrice ?? 0}
            />
            <TextInput
              label="판매 배송비"
              name="shippingFee"
              type="number"
              min={0}
              defaultValue={editingSale?.shippingFee ?? 0}
            />
            <TextInput
              label="판매 수수료"
              name="platformFee"
              type="number"
              min={0}
              defaultValue={editingSale?.platformFee ?? 0}
            />
            <MarketplaceInput
              label="판매처"
              options={SALE_MARKETPLACES}
              defaultValue={editingSale?.marketplace ?? "번개장터"}
            />
            <div className="field span-2">
              <label htmlFor="sale-memo">메모</label>
              <textarea id="sale-memo" name="memo" defaultValue={editingSale?.memo ?? ""} />
            </div>
          </div>
          <div className="sheet-summary">
            <ClipboardList aria-hidden="true" size={19} />
            <span>선택 상품 보유 가능 수량 {formatNumber(availableQuantity)}개</span>
            <strong>원가 {formatCurrency(unitCost, selectedPurchase?.currency)}</strong>
          </div>
          <div className="sheet__footer">
            <button className="button button--ghost" type="button" onClick={onClose}>
              취소
            </button>
            <button className="button button--primary" disabled={isSaving} type="submit">
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
