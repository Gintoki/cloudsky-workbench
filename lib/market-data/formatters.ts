import type { ComparableMarketRecord } from "@/lib/domain/types";

export function formatComparableDate(value: string | null | undefined) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

export function formatComparablePrice(
  value: number | null,
  currency: ComparableMarketRecord["currency"],
) {
  if (value === null) return "--";
  const unit = currency === "USD" ? "美元" : currency === "HKD" ? "港元" : "人民币";
  return `${value.toLocaleString("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} ${unit}`;
}

export function formatComparableScale(
  value: number | null,
  currency: ComparableMarketRecord["currency"],
) {
  if (value === null) return "--";
  const unit = currency === "USD" ? "亿美元" : currency === "HKD" ? "亿港元" : "亿人民币";
  return `${(value / 100_000_000).toLocaleString("zh-CN", {
    maximumFractionDigits: 1,
  })}${unit}`;
}

export function getPriceSales(record: ComparableMarketRecord) {
  if (
    record.marketCap === null ||
    record.revenue === null ||
    record.revenue === 0 ||
    record.currency !== record.financialCurrency
  ) {
    return null;
  }
  return record.marketCap / record.revenue;
}

export function marketLabel(market: ComparableMarketRecord["market"]) {
  return market === "CN" ? "A股" : market === "HK" ? "港股" : "美股";
}
