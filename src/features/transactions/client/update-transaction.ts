import type { TransactionType } from "../lib/add-transaction-form-schema";
import type { CashflowType } from "../lib/cashflow-types";

type UpdateTransactionPayload = Readonly<{
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
}>;

export type UpdateTransactionResponse = Readonly<{
  portfolioId: string;
  oldTradeDate: string;
  newTradeDate: string;
  groupId: string;
  replacedCount: number;
}>;

export async function updateTransaction(
  transactionId: string,
  payload: UpdateTransactionPayload
): Promise<UpdateTransactionResponse> {
  const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | UpdateTransactionResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się zaktualizować transakcji.";
    throw new Error(message);
  }

  if (!data || !("portfolioId" in data)) {
    throw new Error("Brak odpowiedzi po aktualizacji transakcji.");
  }

  return data;
}
