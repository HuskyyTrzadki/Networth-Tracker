import type {
  EconomicCurrencyExposureApiPayload,
  EconomicCurrencyExposureApiResponse,
} from "../lib/currency-exposure";

export async function getEconomicCurrencyExposure(
  payload: EconomicCurrencyExposureApiPayload,
  signal?: AbortSignal
): Promise<EconomicCurrencyExposureApiResponse> {
  const requestStartedAt = performance.now();
  const response = await fetch("/api/portfolio/currency-exposure/economic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  const data = (await response.json().catch(() => null)) as
    | EconomicCurrencyExposureApiResponse
    | { message?: string }
    | null;

  if (!response.ok) {
    const message =
      data && "message" in data && data.message
        ? data.message
        : "Nie udało się obliczyć ekspozycji gospodarczej.";
    throw new Error(message);
  }

  if (!data || !("modelMode" in data) || data.modelMode !== "ECONOMIC") {
    throw new Error("Brak odpowiedzi dla ekspozycji gospodarczej.");
  }

  const clientLogsEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_CURRENCY_EXPOSURE_CLIENT_LOGS === "1" ||
    process.env.NEXT_PUBLIC_CURRENCY_EXPOSURE_CLIENT_LOGS === "true";

  if (clientLogsEnabled) {
    const traceId = response.headers.get("X-Currency-Exposure-Trace-Id");
    console.info("[currency-exposure][economic] client_response", {
      traceId,
      durationMs: Math.round(performance.now() - requestStartedAt),
      fromCache: data.meta.fromCache,
      model: data.meta.model,
      promptVersion: data.meta.promptVersion,
      chart: data.chart,
    });
  }

  return data;
}
