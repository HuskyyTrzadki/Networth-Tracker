import type { TransactionType } from "../lib/add-transaction-form-schema";
import type { CashflowType } from "../lib/cashflow-types";
import type { InstrumentType } from "../lib/instrument-search";

export type CreateTransactionPayload = Readonly<{
  type: TransactionType;
  date: string;
  quantity: string;
  price: string;
  fee: string;
  consumeCash?: boolean;
  cashCurrency?: string;
  fxFee?: string;
  cashflowType?: CashflowType;
  notes: string;
  portfolioId: string;
  clientRequestId: string;
  instrument: Readonly<{
    provider: string;
    providerKey?: string;
    symbol: string;
    name: string;
    currency: string;
    instrumentType?: InstrumentType;
    exchange?: string;
    region?: string;
    logoUrl?: string | null;
  }>;
}>;

export type CreateTransactionResponse = Readonly<{
  transactionId: string;
  instrumentId: string;
  deduped: boolean;
}>;

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<CreateTransactionResponse> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreateTransactionResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się zapisać transakcji.";
    throw new Error(message);
  }

  if (!data || !("transactionId" in data)) {
    throw new Error("Brak odpowiedzi po zapisie transakcji.");
  }

  return data;
}
