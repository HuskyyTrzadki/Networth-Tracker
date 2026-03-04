import type { StockTradeMarker } from "@/features/stocks/types";
import { toClientError } from "@/lib/http/client-error";

type TradeMarkersPayload = Readonly<{
  markers?: readonly StockTradeMarker[];
}>;

export async function getStockTradeMarkers(
  providerKey: string,
  signal?: AbortSignal
): Promise<readonly StockTradeMarker[]> {
  const response = await fetch(
    `/api/stocks/${encodeURIComponent(providerKey)}/trade-markers`,
    { signal }
  );

  const payload = (await response.json().catch(() => null)) as TradeMarkersPayload | null;
  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw toClientError(
      payload,
      "Nie udało się pobrać znacznikow transakcji.",
      response.status
    );
  }

  if (!payload?.markers) {
    return [];
  }

  return payload.markers;
}
