export type InstrumentPriceOnDateResponse = Readonly<{
  selectedDate: string;
  marketDate: string | null;
  ohlc: Readonly<{
    open: string | null;
    high: string | null;
    low: string | null;
    close: string;
  }> | null;
  suggestedPrice: string | null;
  range: Readonly<{ low: string; high: string }> | null;
  isFilledFromPreviousSession: boolean;
  warning: string | null;
}>;

export async function getInstrumentPriceOnDate(input: {
  provider: string;
  providerKey: string;
  date: string;
}): Promise<InstrumentPriceOnDateResponse> {
  const params = new URLSearchParams({
    provider: input.provider,
    providerKey: input.providerKey,
    date: input.date,
  });

  const response = await fetch(`/api/instruments/price-on-date?${params.toString()}`);

  const data = (await response.json().catch(() => null)) as
    | InstrumentPriceOnDateResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się pobrać ceny historycznej.";
    throw new Error(message);
  }

  if (!data || !("selectedDate" in data)) {
    throw new Error("Brak danych ceny historycznej.");
  }

  return data;
}
