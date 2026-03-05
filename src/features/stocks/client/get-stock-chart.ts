import type {
  StockChartOverlay,
  StockChartRange,
  StockChartResponse,
} from "@/features/stocks/types";
import { requestJson } from "@/lib/http/client-request";

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

  const { payload } = await requestJson(
    `/api/public/stocks/${encodeURIComponent(providerKey)}/chart?${params.toString()}`,
    {
      signal,
      credentials: "omit",
      fallbackMessage: "Nie udało się pobrać wykresu.",
    }
  );

  if (!payload || typeof payload !== "object" || !("points" in payload)) {
    throw new Error("Brak danych wykresu.");
  }

  return payload as StockChartResponse;
}
