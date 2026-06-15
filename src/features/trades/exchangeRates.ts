import type { Currency } from "./types";

type CurrencyApiResponse = Record<string, Record<string, number | undefined> | undefined>;

const CURRENCY_API_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";

export async function fetchExchangeRateToKrw(currency: Currency, date: string) {
  if (currency === "KRW") {
    return 1;
  }

  const currencyCode = currency.toLowerCase();
  const response = await fetch(
    `${CURRENCY_API_BASE_URL}@${date}/v1/currencies/${currencyCode}.json`,
  );

  if (!response.ok) {
    throw new Error("환율 정보를 불러오지 못했습니다.");
  }

  const data = (await response.json()) as CurrencyApiResponse;
  const rate = data[currencyCode]?.krw;

  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error("원화 환율 정보를 찾지 못했습니다.");
  }

  return rate;
}
