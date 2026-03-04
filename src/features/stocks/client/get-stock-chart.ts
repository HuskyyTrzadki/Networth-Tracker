import type {
  StockChartOverlay,
  StockChartRange,
  StockChartResponse,
} from "@/features/stocks/types";
import { toClientError } from "@/lib/http/client-error";

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

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(data, "Nie udało się pobrać wykresu.", response.status);
  }

  if (!data || typeof data !== "object" || !("points" in data)) {
    throw new Error("Brak danych wykresu.");
  }

  return data as StockChartResponse;
}
