import type {
  EconomicCurrencyExposureApiPayload,
  EconomicCurrencyExposureApiResponse,
} from "../lib/currency-exposure";
import { requestJson } from "@/lib/http/client-request";

export async function getEconomicCurrencyExposure(
  requestPayload: EconomicCurrencyExposureApiPayload,
  signal?: AbortSignal
): Promise<EconomicCurrencyExposureApiResponse> {
  const requestStartedAt = performance.now();
  const { response, payload: responsePayload } = await requestJson(
    "/api/portfolio/currency-exposure/economic",
    {
      method: "POST",
      json: requestPayload,
      signal,
      fallbackMessage: "Nie udało się obliczyć ekspozycji gospodarczej.",
    }
  );

  if (
    !responsePayload ||
    typeof responsePayload !== "object" ||
    !("modelMode" in responsePayload) ||
    (responsePayload as { modelMode?: unknown }).modelMode !== "ECONOMIC"
  ) {
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
      status: (responsePayload as EconomicCurrencyExposureApiResponse).status,
      fromCache: (responsePayload as EconomicCurrencyExposureApiResponse).meta.fromCache,
      model: (responsePayload as EconomicCurrencyExposureApiResponse).meta.model,
      promptVersion: (responsePayload as EconomicCurrencyExposureApiResponse).meta.promptVersion,
      chart: (responsePayload as EconomicCurrencyExposureApiResponse).chart,
    });
  }

  return responsePayload as EconomicCurrencyExposureApiResponse;
}
