import { requestJson } from "@/lib/http/client-request";

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

  const { payload } = await requestJson(
    `/api/instruments/price-on-date?${params.toString()}`,
    {
      fallbackMessage: "Nie udało się pobrać ceny historycznej.",
    }
  );

  if (
    !payload ||
    typeof payload !== "object" ||
    !("selectedDate" in payload)
  ) {
    throw new Error("Brak danych ceny historycznej.");
  }

  return payload as InstrumentPriceOnDateResponse;
}
