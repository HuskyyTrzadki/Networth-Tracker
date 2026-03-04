import type { CreatePortfolioInput } from "../lib/create-portfolio-schema";
import { toClientError } from "@/lib/http/client-error";

export type CreatePortfolioResponse = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
  isTaxAdvantaged: boolean;
}>;

export async function createPortfolio(
  payload: CreatePortfolioInput
): Promise<CreatePortfolioResponse> {
  const response = await fetch("/api/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się utworzyć portfela.",
      response.status
    );
  }

  if (!data || typeof data !== "object" || !("id" in data)) {
    throw new Error("Brak odpowiedzi po utworzeniu portfela.");
  }

  return data as CreatePortfolioResponse;
}
