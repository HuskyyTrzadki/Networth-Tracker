import type {
  CurrencyExposureChartRow,
  CurrencyExposureDetailsRow,
  CurrencyExposureMode,
  EconomicCurrencyExposureApiResponse,
} from "@/features/portfolio/lib/currency-exposure";

export type CurrencyExposureDeltaChip = Readonly<{
  currencyCode: string;
  delta: number;
}>;

type CurrencyExposureData = Readonly<{
  chart: readonly CurrencyExposureChartRow[];
  details: readonly CurrencyExposureDetailsRow[];
}>;

export const parseCurrencyExposureMode = (
  value: string
): CurrencyExposureMode | null => {
  if (value === "NOTOWANIA" || value === "GOSPODARCZA") {
    return value;
  }

  return null;
};

export const resolveCurrencyExposureErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Nie udało się policzyć ekspozycji.";

export const buildExposureDeltaChips = (
  currentRows: readonly CurrencyExposureChartRow[],
  comparisonRows: readonly CurrencyExposureChartRow[]
): readonly CurrencyExposureDeltaChip[] => {
  const comparisonShareByCurrency = new Map(
    comparisonRows.map((row) => [row.currencyCode, row.sharePct] as const)
  );
  const currentShareByCurrency = new Map(
    currentRows.map((row) => [row.currencyCode, row.sharePct] as const)
  );
  const currencyCodes = new Set([
    ...currentRows.map((row) => row.currencyCode),
    ...comparisonRows.map((row) => row.currencyCode),
  ]);

  return Array.from(currencyCodes)
    .map((currencyCode) => {
      const currentShare = currentShareByCurrency.get(currencyCode) ?? 0;
      const comparisonShare = comparisonShareByCurrency.get(currencyCode) ?? 0;
      const delta = currentShare - comparisonShare;

      return {
        currencyCode,
        delta,
      };
    })
    .filter((row) => Math.abs(row.delta) >= 0.1)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 4);
};

export const buildCurrencyExposureWidgetViewState = ({
  mode,
  investorData,
  economicResponse,
}: Readonly<{
  mode: CurrencyExposureMode;
  investorData: CurrencyExposureData;
  economicResponse: EconomicCurrencyExposureApiResponse | null;
}>) => {
  const economicReadyResponse =
    economicResponse?.status === "READY" ? economicResponse : null;
  const isPendingSourceData = economicResponse?.status === "PENDING_SOURCE_DATA";

  const activeChart =
    mode === "GOSPODARCZA" ? economicReadyResponse?.chart ?? [] : investorData.chart;
  const activeDetails =
    mode === "GOSPODARCZA"
      ? economicReadyResponse?.details ?? []
      : investorData.details;
  const comparisonChart =
    mode === "GOSPODARCZA" ? investorData.chart : economicReadyResponse?.chart ?? [];
  const deltaChips = economicReadyResponse
    ? buildExposureDeltaChips(activeChart, comparisonChart)
    : [];

  return {
    activeChart,
    activeDetails,
    comparisonChart,
    deltaChips,
    deltaReferenceLabel: mode === "GOSPODARCZA" ? "vs Notowania" : "vs Gospodarcza",
    economicReadyResponse,
    isPendingSourceData,
  } as const;
};
