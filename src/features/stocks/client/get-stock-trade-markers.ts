import type { StockTradeMarker } from "@/features/stocks";

type TradeMarkersPayload = Readonly<{
  markers?: readonly StockTradeMarker[];
  message?: string;
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
    const message = payload?.message ?? "Nie udało się pobrać znacznikow transakcji.";
    throw new Error(message);
  }

  if (!payload?.markers) {
    return [];
  }

  return payload.markers;
}
