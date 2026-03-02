export type CurrencyExposureMode = "NOTOWANIA" | "GOSPODARCZA";

export type CurrencyExposureChartRow = Readonly<{
  currencyCode: string;
  sharePct: number;
  valueBase: string;
}>;

export type CurrencyExposureDriver = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  contributionPct: number;
  contributionWithinCurrencyPct: number;
  contributionValueBase: string;
}>;

export type CurrencyExposureDetailsRow = Readonly<{
  currencyCode: string;
  drivers: readonly CurrencyExposureDriver[];
}>;

type EconomicCurrencyExposureMeta = Readonly<{
  model: string;
  promptVersion: string;
  fromCache: boolean;
}>;

export type EconomicCurrencyExposureReadyResponse = Readonly<{
  scope: "ALL" | "PORTFOLIO";
  portfolioId: string | null;
  asOf: string | null;
  modelMode: "ECONOMIC";
  status: "READY";
  chart: readonly CurrencyExposureChartRow[];
  details: readonly CurrencyExposureDetailsRow[];
  meta: EconomicCurrencyExposureMeta;
}>;

export type EconomicCurrencyExposurePendingResponse = Readonly<{
  scope: "ALL" | "PORTFOLIO";
  portfolioId: string | null;
  asOf: string | null;
  modelMode: "ECONOMIC";
  status: "PENDING_SOURCE_DATA";
  chart: readonly [];
  details: readonly [];
  pendingProviderKeys: readonly string[];
  meta: EconomicCurrencyExposureMeta;
}>;

export type EconomicCurrencyExposureApiResponse =
  | EconomicCurrencyExposureReadyResponse
  | EconomicCurrencyExposurePendingResponse;

export type EconomicCurrencyExposureApiPayload = Readonly<{
  portfolioId: string | null;
}>;
