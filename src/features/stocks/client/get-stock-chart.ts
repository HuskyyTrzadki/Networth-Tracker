import type {
  StockChartOverlay,
  StockChartRange,
  StockChartResponse,
} from "@/features/stocks";

export async function getStockChart(
  providerKey: string,
  range: StockChartRange,
  overlays: readonly StockChartOverlay[],
  signal?: AbortSignal
): Promise<StockChartResponse> {
  const params = new URLSearchParams({ range });
  if (overlays.length > 0) {
    params.set("overlays", overlays.join(","));
  }

  const response = await fetch(
    `/api/public/stocks/${encodeURIComponent(providerKey)}/chart?${params.toString()}`,
    {
      signal,
      credentials: "omit",
    }
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
