import type { DividendInboxResult } from "@/features/portfolio/lib/dividend-inbox";
import { toClientError } from "@/lib/http/client-error";

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

  const response = await fetch(`/api/dividends/inbox?${query.toString()}`, {
    signal,
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się pobrać skrzynki dywidend.",
      response.status
    );
  }

  if (!data || typeof data !== "object" || !("scope" in data)) {
    throw new Error("Brak odpowiedzi dla skrzynki dywidend.");
  }

  return data as DividendInboxResult;
}

export async function bookDividend(
  payload: BookDividendPayload
): Promise<Readonly<{ transactionId: string }>> {
  const response = await fetch("/api/dividends/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się zaksięgować dywidendy.",
      response.status
    );
  }

  if (!data || typeof data !== "object" || !("transactionId" in data)) {
    throw new Error("Brak odpowiedzi po księgowaniu dywidendy.");
  }

  return data as Readonly<{ transactionId: string }>;
}
