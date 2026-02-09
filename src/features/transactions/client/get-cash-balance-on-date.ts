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

  const data = (await response.json().catch(() => null)) as
    | CashBalanceOnDateResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się pobrać salda gotówki na wybraną datę.";
    throw new Error(message);
  }

  if (!data || !("availableCashOnDate" in data)) {
    throw new Error("Brak odpowiedzi z saldem gotówki.");
  }

  return data;
}
