import type { DividendInboxResult } from "@/features/portfolio/lib/dividend-inbox";

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
  const data = (await response.json().catch(() => null)) as
    | DividendInboxResult
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się pobrać skrzynki dywidend.";
    throw new Error(message);
  }

  if (!data || !("scope" in data)) {
    throw new Error("Brak odpowiedzi dla skrzynki dywidend.");
  }

  return data;
}

export async function bookDividend(
  payload: BookDividendPayload
): Promise<Readonly<{ transactionId: string }>> {
  const response = await fetch("/api/dividends/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | Readonly<{ transactionId: string }>
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się zaksięgować dywidendy.";
    throw new Error(message);
  }

  if (!data || !("transactionId" in data)) {
    throw new Error("Brak odpowiedzi po księgowaniu dywidendy.");
  }

  return data;
}

