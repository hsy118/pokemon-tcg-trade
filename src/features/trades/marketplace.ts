export const CUSTOM_MARKETPLACE_OPTION = "기타";
export const MARKETPLACE_MAX_LENGTH = 50;

export function getMarketplaceSelectValue(
  value: string,
  options: readonly string[],
) {
  return options.includes(value) ? value : CUSTOM_MARKETPLACE_OPTION;
}

export function getMarketplaceCustomValue(value: string, options: readonly string[]) {
  return options.includes(value) ? "" : value;
}

export function validateMarketplace(selected: string, customValue: string) {
  const value =
    selected === CUSTOM_MARKETPLACE_OPTION ? customValue.trim() : selected.trim();

  if (!value) {
    return {
      value,
      error: "기타를 선택했다면 거래처를 입력해 주세요.",
    };
  }

  if (value.length > MARKETPLACE_MAX_LENGTH) {
    return {
      value,
      error: `거래처는 ${MARKETPLACE_MAX_LENGTH}자 이하로 입력해 주세요.`,
    };
  }

  return {
    value,
    error: null,
  };
}
