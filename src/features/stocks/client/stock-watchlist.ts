import { toClientError } from "@/lib/http/client-error";

export async function getStockWatchlistStatus(
  providerKey: string
): Promise<Readonly<{ isFavorite: boolean }>> {
  const response = await fetch(
    `/api/stocks/watchlist?providerKey=${encodeURIComponent(providerKey)}`,
    { method: "GET" }
  );
  if (response.status === 401) {
    return { isFavorite: false };
  }
  const data = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się pobrać statusu ulubionych.",
      response.status
    );
  }
  if (
    !data ||
    typeof data !== "object" ||
    !("isFavorite" in data) ||
    typeof (data as { isFavorite?: unknown }).isFavorite !== "boolean"
  ) {
    throw new Error("Nieprawidłowa odpowiedź serwera.");
  }
  return data as { isFavorite: boolean };
}
