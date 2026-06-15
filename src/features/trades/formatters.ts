import type { Currency } from "./types";

export const formatCurrency = (value: number, currency: Currency = "KRW") =>
  new Intl.NumberFormat("ko-KR", {
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    style: "currency",
    currency,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value);

export const formatRate = (value: number) => `${value.toFixed(2)}%`;

export const toDateInputValue = (date = new Date()) => date.toISOString().slice(0, 10);
