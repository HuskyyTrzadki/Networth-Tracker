import type { CreatePortfolioInput } from "../lib/create-portfolio-schema";
import { requestJson } from "@/lib/http/client-request";

export type CreatePortfolioResponse = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
  isTaxAdvantaged: boolean;
}>;

export async function createPortfolio(
  payload: CreatePortfolioInput
): Promise<CreatePortfolioResponse> {
  const { payload: responsePayload } = await requestJson("/api/portfolios", {
    method: "POST",
    json: payload,
    fallbackMessage: "Nie udało się utworzyć portfela.",
  });

  if (
    !responsePayload ||
    typeof responsePayload !== "object" ||
    !("id" in responsePayload)
  ) {
    throw new Error("Brak odpowiedzi po utworzeniu portfela.");
  }

  return responsePayload as CreatePortfolioResponse;
}
