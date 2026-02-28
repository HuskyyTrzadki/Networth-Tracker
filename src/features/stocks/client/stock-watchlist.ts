const toErrorMessage = (fallback: string, data: unknown) => {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
};

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
    throw new Error(toErrorMessage("Nie udało się pobrać statusu ulubionych.", data));
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
