import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TradeTimelineView } from "./TradeTimelineView";
import { TradesView } from "./TradesView";
import type { Purchase, Sale } from "./types";
import { useTradeStore } from "./useTradeStore";

vi.mock("./useTradeStore", () => ({
  useTradeStore: vi.fn(),
}));

const mockUseTradeStore = vi.mocked(useTradeStore);

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
  marketplace: "포켓몬센터",
  memo: "컬렉션 보관용",
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
  memo: "빠른 판매",
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
};

function arrangeStore({
  purchases = [basePurchase],
  sales = [],
}: {
  purchases?: Purchase[];
  sales?: Sale[];
} = {}) {
  mockUseTradeStore.mockReturnValue({
    purchases,
    sales,
    isHydrated: true,
    isMutating: false,
    error: null,
    addPurchase: vi.fn(),
    addSale: vi.fn(),
    updatePurchase: vi.fn(),
    updateSale: vi.fn(),
    deletePurchase: vi.fn(),
    deleteSale: vi.fn(),
  });
}

describe("TradesView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    arrangeStore();
  });

  it("renders the Cardfolio inventory hub with three-up inventory cards", () => {
    render(<TradesView />);

    expect(screen.getByRole("heading", { name: /Cardfolio/i })).toBeInTheDocument();
    expect(screen.getByText("보유 카드 앨범")).toBeInTheDocument();
    expect(screen.getByLabelText("보유 카드 목록")).toHaveClass("inventory-grid--three-up");
    expect(screen.getByRole("article", { name: "White Flare Booster Box" })).toHaveClass(
      "inventory-card",
    );
    expect(screen.getByRole("button", { name: "판매 기록" })).toHaveClass("button--sale");
    expect(screen.getByText("보유 2개")).toBeInTheDocument();
    expect(screen.getByText("개당 원가")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "거래 타임라인" })).not.toBeInTheDocument();
  });

  it("opens a sale sheet from an inventory card with the selected item", () => {
    render(<TradesView />);

    fireEvent.click(screen.getByRole("button", { name: /White Flare Booster Box 판매 처리/ }));

    expect(screen.getByRole("dialog", { name: "판매 기록하기" })).toHaveClass("sheet");
    expect(screen.getByDisplayValue("purchase-1")).toBeInTheDocument();
    expect(screen.getByText("선택 상품 보유 가능 수량 2개")).toBeInTheDocument();
  });

  it("filters sale products with search and selects the matching purchase", () => {
    arrangeStore({
      purchases: [
        basePurchase,
        {
          ...basePurchase,
          id: "purchase-2",
          productName: "Pikachu Promo Card",
          category: "싱글 카드",
          purchaseDate: "2026-06-20",
          quantity: 3,
          unitPrice: 120,
          shippingFee: 0,
          taxFee: 0,
          currency: "USD",
          marketplace: "이베이",
        },
      ],
    });
    render(<TradesView />);

    fireEvent.click(screen.getByRole("button", { name: "판매 기록" }));
    const dialog = screen.getByRole("dialog", { name: "판매 기록하기" });

    fireEvent.change(within(dialog).getByLabelText("판매 상품 검색"), {
      target: { value: "pikachu" },
    });

    expect(
      within(dialog).queryByRole("option", { name: /White Flare Booster Box/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("option", { name: /Pikachu Promo Card/ }));

    expect(screen.getByDisplayValue("purchase-2")).toBeInTheDocument();
    expect(screen.getByText("선택 상품 보유 가능 수량 3개")).toBeInTheDocument();
    expect(screen.getByText("원가 $120")).toBeInTheDocument();
  });

  it("shows inline form errors instead of browser alerts", () => {
    render(<TradesView />);

    fireEvent.click(screen.getByRole("button", { name: "구매 추가" }));
    fireEvent.change(screen.getByLabelText("상품명"), { target: { value: "" } });
    fireEvent.submit(screen.getByRole("form", { name: "구매 등록 폼" }));

    expect(screen.getByRole("alert")).toHaveTextContent("상품명과 구매 수량을 확인해 주세요.");
  });

  it("renders ledger entries on the dedicated timeline view", () => {
    arrangeStore({ sales: [baseSale] });

    render(<TradeTimelineView />);

    expect(screen.getByRole("heading", { name: "거래 타임라인" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /구매 White Flare Booster Box/ })).toHaveClass(
      "ledger-card",
    );
    expect(screen.getByRole("article", { name: /판매 White Flare Booster Box/ })).toHaveClass(
      "ledger-card",
    );
    expect(screen.getByText("빠른 판매")).toBeInTheDocument();
  });

  it("defaults ledger entries to latest first", () => {
    const olderPurchase: Purchase = {
      ...basePurchase,
      id: "purchase-2",
      productName: "Older Booster Box",
      purchaseDate: "2026-05-01",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
    };
    arrangeStore({ purchases: [olderPurchase, basePurchase], sales: [baseSale] });

    render(<TradeTimelineView />);

    expect(screen.getByLabelText("정렬")).toHaveDisplayValue("최신순");

    const ledgerCards = screen.getAllByRole("article");
    expect(ledgerCards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "판매 White Flare Booster Box",
      "구매 White Flare Booster Box",
      "구매 Older Booster Box",
    ]);
  });
});
