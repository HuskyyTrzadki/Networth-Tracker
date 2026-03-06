import { requestJson } from "@/lib/http/client-request";

export type TransactionDialogBalancesResponse = Readonly<{
  portfolioId: string;
  cashBalances: Readonly<Record<string, string>>;
  assetBalances: Readonly<Record<string, string>>;
}>;

export async function getTransactionDialogBalances(input: Readonly<{
  portfolioId: string;
}>): Promise<TransactionDialogBalancesResponse> {
  const { payload } = await requestJson("/api/transactions/dialog-balances", {
    method: "POST",
    json: input,
    fallbackMessage: "Nie udało się pobrać stanu portfela.",
  });

  if (
    !payload ||
    typeof payload !== "object" ||
    !("portfolioId" in payload)
  ) {
    throw new Error("Brak odpowiedzi ze stanem portfela.");
  }

  return payload as TransactionDialogBalancesResponse;
}
