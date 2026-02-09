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

  const data = (await response.json().catch(() => null)) as
    | FxPreviewResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się pobrać kursu FX.";
    throw new Error(message);
  }

  if (!data || !("rate" in data)) {
    throw new Error("Brak odpowiedzi z kursem FX.");
  }

  return data;
}
