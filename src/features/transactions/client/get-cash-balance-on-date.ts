import { requestJson } from "@/lib/http/client-request";

export type CashBalanceOnDateResponse = Readonly<{
  portfolioId: string;
  cashCurrency: string;
  tradeDate: string;
  availableCashOnDate: string;
}>;

export async function getCashBalanceOnDate(input: Readonly<{
  portfolioId: string;
  cashCurrency: string;
  tradeDate: string;
}>): Promise<CashBalanceOnDateResponse> {
  const { payload } = await requestJson("/api/transactions/cash-balance-on-date", {
    method: "POST",
    json: input,
    fallbackMessage: "Nie udało się pobrać salda gotówki na wybraną datę.",
  });

  if (
    !payload ||
    typeof payload !== "object" ||
    !("availableCashOnDate" in payload)
  ) {
    throw new Error("Brak odpowiedzi z saldem gotówki.");
  }

  return payload as CashBalanceOnDateResponse;
}
