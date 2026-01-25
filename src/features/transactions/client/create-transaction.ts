import type { TransactionType } from "../lib/add-transaction-form-schema";

export type CreateTransactionPayload = Readonly<{
  type: TransactionType;
  date: string;
  quantity: string;
  price: string;
  fee: string;
  notes: string;
  clientRequestId: string;
  instrument: Readonly<{
    provider: string;
    providerKey?: string;
    symbol: string;
    name: string;
    currency: string;
    exchange?: string;
    region?: string;
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
