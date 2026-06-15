import { describe, expect, it } from "vitest";
import {
  getMarketplaceCustomValue,
  getMarketplaceSelectValue,
  MARKETPLACE_MAX_LENGTH,
  validateMarketplace,
} from "./marketplace";
import { PURCHASE_MARKETPLACES } from "./constants";

const marketplaces = ["포켓몬센터", "이베이", "기타"] as const;

describe("marketplace helpers", () => {
  it("includes amazon as a predefined purchase marketplace", () => {
    expect(PURCHASE_MARKETPLACES).toContain("아마존");
    expect(PURCHASE_MARKETPLACES).toContain("마트");
  });

  it("uses 기타 when an existing marketplace is not in predefined options", () => {
    expect(getMarketplaceSelectValue("문방구", marketplaces)).toBe("기타");
    expect(getMarketplaceCustomValue("문방구", marketplaces)).toBe("문방구");
  });

  it("validates custom marketplace input with a 50 character limit", () => {
    expect(validateMarketplace("기타", "  아마존  ")).toEqual({
      value: "아마존",
      error: null,
    });
    expect(validateMarketplace("기타", "")).toEqual({
      value: "",
      error: "기타를 선택했다면 거래처를 입력해 주세요.",
    });
    expect(validateMarketplace("기타", "a".repeat(MARKETPLACE_MAX_LENGTH + 1))).toEqual({
      value: "a".repeat(MARKETPLACE_MAX_LENGTH + 1),
      error: "거래처는 50자 이하로 입력해 주세요.",
    });
  });
});
