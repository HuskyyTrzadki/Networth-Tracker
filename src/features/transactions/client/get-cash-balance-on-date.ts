import { toClientError } from "@/lib/http/client-error";

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
  const response = await fetch("/api/transactions/cash-balance-on-date", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się pobrać salda gotówki na wybraną datę.",
      response.status
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("availableCashOnDate" in data)
  ) {
    throw new Error("Brak odpowiedzi z saldem gotówki.");
  }

  return data as CashBalanceOnDateResponse;
}
