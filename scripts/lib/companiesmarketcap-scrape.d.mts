export type CompaniesMarketCapMetric =
  | "revenue"
  | "earnings"
  | "pe_ratio"
  | "ps_ratio";

export type CompaniesMarketCapAnnualHistoryRow = Readonly<{
  year: number;
  value: number | null;
  changePercent: number | null;
  isTtm: boolean;
  periodLabel: string | null;
}>;

export declare const COMPANIES_MARKETCAP_METRICS: readonly CompaniesMarketCapMetric[];

export declare function buildCompaniesMarketCapSlugCandidates(input: {
  name?: string | null;
}): readonly string[];

export declare function normalizeCompaniesMarketCapMoneyValue(
  rawValue: string
): number | null;

export declare function normalizeCompaniesMarketCapRatioValue(
  rawValue: string
): number | null;

export declare function normalizeCompaniesMarketCapPercentChange(
  rawValue: string
): number | null;

export declare function parseCompaniesMarketCapMetricPage(input: {
  html: string;
  metric: CompaniesMarketCapMetric;
}): {
  title: string;
  h1: string;
  ttmValue: number | null;
  ttmLabel: string | null;
  annualHistory: readonly CompaniesMarketCapAnnualHistoryRow[];
};

export declare function resolveCompaniesMarketCapSlug(input: {
  instrument: {
    provider_key?: string;
    symbol?: string;
    name?: string | null;
  };
  fetchHtml?: (url: string) => Promise<string>;
}): Promise<{
  slug: string;
  sourceUrl: string;
  resolvedFrom: string;
  revenuePage: {
    html: string;
    parsedPage: ReturnType<typeof parseCompaniesMarketCapMetricPage>;
  };
} | null>;

export declare function scrapeCompaniesMarketCapMetrics(input: {
  instrument: {
    provider_key: string;
    symbol?: string;
    name?: string | null;
  };
  slug: string;
  fetchHtml?: (url: string) => Promise<string>;
  preloadedRevenuePage?: {
    html: string;
    parsedPage: ReturnType<typeof parseCompaniesMarketCapMetricPage>;
  } | null;
}): Promise<
  readonly Readonly<{
    provider: string;
    provider_key: string;
    metric: CompaniesMarketCapMetric;
    source: string;
    slug: string;
    source_url: string;
    ttm_value: number | null;
    ttm_label: string | null;
    annual_history: readonly CompaniesMarketCapAnnualHistoryRow[];
    metadata: Record<string, unknown>;
    fetched_at: string;
  }>[]
>;
