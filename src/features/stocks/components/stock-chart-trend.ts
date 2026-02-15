export type StockPriceTrendDirection = "up" | "down" | "flat";

export type StockPriceTrend = Readonly<{
  direction: StockPriceTrendDirection;
  start: number | null;
  end: number | null;
  changePercent: number | null;
}>;

const FLAT_CHANGE_THRESHOLD_PERCENT = 0.1;

const isFiniteNumber = (value: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const resolveStockPriceTrend = (
  prices: readonly (number | null)[]
): StockPriceTrend => {
  const finitePrices = prices.filter(isFiniteNumber);
  const start = finitePrices[0] ?? null;
  const end = finitePrices.at(-1) ?? null;

  if (start === null || end === null || start === 0) {
    return {
      direction: "flat",
      start,
      end,
      changePercent: null,
    };
  }

  const changePercent = ((end - start) / start) * 100;
  const direction: StockPriceTrendDirection =
    changePercent > FLAT_CHANGE_THRESHOLD_PERCENT
      ? "up"
      : changePercent < -FLAT_CHANGE_THRESHOLD_PERCENT
        ? "down"
        : "flat";

  return {
    direction,
    start,
    end,
    changePercent,
  };
};

export const getPriceTrendColor = (direction: StockPriceTrendDirection) => {
  if (direction === "up") return "var(--profit)";
  if (direction === "down") return "var(--loss)";
  return "var(--chart-1)";
};
