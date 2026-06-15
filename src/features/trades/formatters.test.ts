import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyWithKrw } from "./formatters";

describe("formatters", () => {
  it("formats money with the provided purchase currency", () => {
    expect(formatCurrency(120, "USD")).toBe("$120");
  });

  it("adds the registered KRW conversion next to foreign currency amounts", () => {
    expect(formatCurrencyWithKrw(90, "USD", 1555.55)).toBe("$90 (₩140,000)");
    expect(formatCurrencyWithKrw(10_000, "JPY", 9.12)).toBe("¥10,000 (₩91,200)");
  });

  it("keeps KRW amounts unchanged even when an exchange rate is present", () => {
    expect(formatCurrencyWithKrw(14_000, "KRW", 1)).toBe("₩14,000");
  });
});
