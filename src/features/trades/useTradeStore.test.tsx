import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTradeStore } from "./useTradeStore";

type TableName = "purchases" | "sales";
type TableResult = {
  data: [];
  error: null;
};

const mockState = vi.hoisted(() => ({
  auth: {
    user: { id: "user-1" },
  },
  from: vi.fn(),
  tableResults: {
    purchases: { data: [], error: null },
    sales: { data: [], error: null },
  },
}));

vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => mockState.auth,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockState.from,
  },
}));

function TradeStoreProbe() {
  const { isHydrated, purchases } = useTradeStore();

  return (
    <div>
      <span data-testid="hydration-state">{isHydrated ? "hydrated" : "loading"}</span>
      <span data-testid="purchase-count">{purchases.length}</span>
    </div>
  );
}

describe("useTradeStore", () => {
  beforeEach(() => {
    mockState.auth.user = { id: "user-1" };
    mockState.tableResults.purchases = { data: [], error: null };
    mockState.tableResults.sales = { data: [], error: null };
    mockState.from.mockReset();
    mockState.from.mockImplementation((table: TableName) => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve(mockState.tableResults[table] as TableResult)),
        })),
      })),
    }));
  });

  it("does not rehydrate trades when only the auth user object changes", async () => {
    const { rerender } = render(<TradeStoreProbe />);

    await waitFor(() => {
      expect(screen.getByTestId("hydration-state")).toHaveTextContent("hydrated");
    });
    expect(mockState.from).toHaveBeenCalledTimes(2);

    mockState.auth.user = { id: "user-1" };
    rerender(<TradeStoreProbe />);

    expect(screen.getByTestId("hydration-state")).toHaveTextContent("hydrated");
    expect(mockState.from).toHaveBeenCalledTimes(2);
  });
});
