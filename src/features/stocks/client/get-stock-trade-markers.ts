import type { StockTradeMarker } from "@/features/stocks/types";
import { requestJson } from "@/lib/http/client-request";

type TradeMarkersPayload = Readonly<{
  markers?: readonly StockTradeMarker[];
}>;

export async function getStockTradeMarkers(
  providerKey: string,
  signal?: AbortSignal
): Promise<readonly StockTradeMarker[]> {
  const { response, payload } = await requestJson(
    `/api/stocks/${encodeURIComponent(providerKey)}/trade-markers`,
    {
      signal,
      fallbackMessage: "Nie udało się pobrać znacznikow transakcji.",
      allowStatuses: [401],
    }
  );

  if (response.status === 401) {
    return [];
  }

  const parsedPayload = payload as TradeMarkersPayload | null;
  if (!parsedPayload?.markers) {
    return [];
  }

  return parsedPayload.markers;
}
