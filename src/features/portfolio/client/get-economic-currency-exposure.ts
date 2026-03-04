import type {
  EconomicCurrencyExposureApiPayload,
  EconomicCurrencyExposureApiResponse,
} from "../lib/currency-exposure";
import { toClientError } from "@/lib/http/client-error";

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

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      data,
      "Nie udało się obliczyć ekspozycji gospodarczej.",
      response.status
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("modelMode" in data) ||
    (data as { modelMode?: unknown }).modelMode !== "ECONOMIC"
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
      status: (data as EconomicCurrencyExposureApiResponse).status,
      fromCache: (data as EconomicCurrencyExposureApiResponse).meta.fromCache,
      model: (data as EconomicCurrencyExposureApiResponse).meta.model,
      promptVersion: (data as EconomicCurrencyExposureApiResponse).meta.promptVersion,
      chart: (data as EconomicCurrencyExposureApiResponse).chart,
    });
  }

  return data as EconomicCurrencyExposureApiResponse;
}
