import type { CreatePortfolioInput } from "../lib/create-portfolio-schema";

export type CreatePortfolioResponse = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

export async function createPortfolio(
  payload: CreatePortfolioInput
): Promise<CreatePortfolioResponse> {
  const response = await fetch("/api/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | CreatePortfolioResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się utworzyć portfela.";
    throw new Error(message);
  }

  if (!data || !("id" in data)) {
    throw new Error("Brak odpowiedzi po utworzeniu portfela.");
  }

  return data;
}
