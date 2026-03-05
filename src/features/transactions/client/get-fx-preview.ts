import { requestJson } from "@/lib/http/client-request";

export type FxPreviewResponse = Readonly<{
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  asOf: string;
  provider: string;
}>;

export async function getFxPreview(input: Readonly<{
  fromCurrency: string;
  toCurrency: string;
}>): Promise<FxPreviewResponse> {
  const { payload } = await requestJson("/api/transactions/fx-preview", {
    method: "POST",
    json: input,
    fallbackMessage: "Nie udało się pobrać kursu FX.",
  });

  if (!payload || typeof payload !== "object" || !("rate" in payload)) {
    throw new Error("Brak odpowiedzi z kursem FX.");
  }

  return payload as FxPreviewResponse;
}
