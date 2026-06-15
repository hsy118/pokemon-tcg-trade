import { describe, expect, it } from "vitest";
import { formatCurrency } from "./formatters";

describe("formatters", () => {
  it("formats money with the provided purchase currency", () => {
    expect(formatCurrency(120, "USD")).toBe("$120");
  });
});
