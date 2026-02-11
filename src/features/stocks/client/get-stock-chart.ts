import type { StockChartRange, StockChartResponse } from "@/features/stocks";

export async function getStockChart(
  providerKey: string,
  range: StockChartRange,
  includePe: boolean,
  signal?: AbortSignal
): Promise<StockChartResponse> {
  const params = new URLSearchParams({
    range,
    includePe: includePe ? "1" : "0",
  });

  const response = await fetch(
    `/api/stocks/${encodeURIComponent(providerKey)}/chart?${params.toString()}`,
    { signal }
  );

  const data = (await response.json().catch(() => null)) as
    | StockChartResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się pobrać wykresu.";
    throw new Error(message);
  }

  if (!data || !("points" in data)) {
    throw new Error("Brak danych wykresu.");
  }

  return data;
}
