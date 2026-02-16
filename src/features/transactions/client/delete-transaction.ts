export type DeleteTransactionResponse = Readonly<{
  deletedCount: number;
  portfolioId: string;
  tradeDate: string;
}>;

export async function deleteTransaction(
  transactionId: string
): Promise<DeleteTransactionResponse> {
  const response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => null)) as
    | DeleteTransactionResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się usunąć transakcji.";
    throw new Error(message);
  }

  if (!data || !("portfolioId" in data)) {
    throw new Error("Brak odpowiedzi po usunięciu transakcji.");
  }

  return data;
}
