import { toClientError } from "@/lib/http/client-error";

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
  const response = await fetch("/api/transactions/fx-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(data, "Nie udało się pobrać kursu FX.", response.status);
  }

  if (!data || typeof data !== "object" || !("rate" in data)) {
    throw new Error("Brak odpowiedzi z kursem FX.");
  }

  return data as FxPreviewResponse;
}
