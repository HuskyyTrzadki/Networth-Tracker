import { requestJson } from "@/lib/http/client-request";

export async function getStockWatchlistStatus(
  providerKey: string
): Promise<Readonly<{ isFavorite: boolean }>> {
  const { response, payload } = await requestJson(
    `/api/stocks/watchlist?providerKey=${encodeURIComponent(providerKey)}`,
    {
      method: "GET",
      fallbackMessage: "Nie udało się pobrać statusu ulubionych.",
      allowStatuses: [401],
    }
  );
  if (response.status === 401) {
    return { isFavorite: false };
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !("isFavorite" in payload) ||
    typeof (payload as { isFavorite?: unknown }).isFavorite !== "boolean"
  ) {
    throw new Error("Nieprawidłowa odpowiedź serwera.");
  }
  return payload as { isFavorite: boolean };
}
