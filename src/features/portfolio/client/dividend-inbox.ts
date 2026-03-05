import type { DividendInboxResult } from "@/features/portfolio/lib/dividend-inbox";
import { requestJson } from "@/lib/http/client-request";

export type BookDividendPayload = Readonly<{
  portfolioId: string;
  providerKey: string;
  symbol: string;
  eventDate: string;
  payoutCurrency: string;
  netAmount: string;
  dividendEventKey: string;
}>;

export async function getDividendInbox(
  portfolioId: string | null,
  signal?: AbortSignal
): Promise<DividendInboxResult> {
  const query = new URLSearchParams();
  if (portfolioId) {
    query.set("portfolioId", portfolioId);
  }
  query.set("windowPastDays", "60");
  query.set("windowFutureDays", "60");

  const { payload } = await requestJson(`/api/dividends/inbox?${query.toString()}`, {
    signal,
    fallbackMessage: "Nie udało się pobrać skrzynki dywidend.",
  });

  if (!payload || typeof payload !== "object" || !("scope" in payload)) {
    throw new Error("Brak odpowiedzi dla skrzynki dywidend.");
  }

  return payload as DividendInboxResult;
}

export async function bookDividend(
  payload: BookDividendPayload
): Promise<Readonly<{ transactionId: string }>> {
  const { payload: responsePayload } = await requestJson("/api/dividends/book", {
    method: "POST",
    json: payload,
    fallbackMessage: "Nie udało się zaksięgować dywidendy.",
  });

  if (
    !responsePayload ||
    typeof responsePayload !== "object" ||
    !("transactionId" in responsePayload)
  ) {
    throw new Error("Brak odpowiedzi po księgowaniu dywidendy.");
  }

  return responsePayload as Readonly<{ transactionId: string }>;
}
