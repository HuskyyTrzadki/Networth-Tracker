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

export type EconomicCurrencyExposureApiResponse = Readonly<{
  scope: "ALL" | "PORTFOLIO";
  portfolioId: string | null;
  asOf: string | null;
  modelMode: "ECONOMIC";
  chart: readonly CurrencyExposureChartRow[];
  details: readonly CurrencyExposureDetailsRow[];
  meta: Readonly<{
    model: string;
    promptVersion: string;
    fromCache: boolean;
  }>;
}>;

export type EconomicCurrencyExposureApiPayload = Readonly<{
  portfolioId: string | null;
}>;
