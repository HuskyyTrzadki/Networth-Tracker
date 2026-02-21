export type DeletePortfolioResponse = Readonly<{
  portfolioId: string;
  deletedTransactionsCount: number;
}>;

export async function deletePortfolio(
  portfolioId: string
): Promise<DeletePortfolioResponse> {
  const response = await fetch(`/api/portfolios/${encodeURIComponent(portfolioId)}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => null)) as
    | DeletePortfolioResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się usunąć portfela.";
    throw new Error(message);
  }

  if (!data || !("portfolioId" in data)) {
    throw new Error("Brak odpowiedzi po usunięciu portfela.");
  }

  return data;
}
