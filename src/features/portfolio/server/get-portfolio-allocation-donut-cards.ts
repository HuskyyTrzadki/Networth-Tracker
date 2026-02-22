import {addDecimals, decimalZero, parseDecimalString} from "@/lib/decimal";
import {formatCurrencyString, getCurrencyFormatter} from "@/lib/format-currency";
import type {createClient} from "@/lib/supabase/server";
import type {CurrencyCode} from "@/features/market-data";
import type {CustomAssetType} from "@/features/transactions/lib/custom-asset-types";

import {getPortfolioSummary} from "./get-portfolio-summary";
import type {ValuedHolding} from "./valuation";

type SupabaseServerClient = ReturnType<typeof createClient>;

type PortfolioOption = Readonly<{
  id: string;
  name: string;
}>;

type AllocationCategoryKey =
  | "REAL_ESTATE"
  | "EQUITIES"
  | "FIXED_INCOME"
  | "CASH"
  | "OTHER";

type AllocationCategoryAggregate = Readonly<{
  share: number;
  valueBase: string;
}>;

export type PortfolioAllocationDonutSlice = Readonly<{
  id: AllocationCategoryKey;
  label: string;
  share: number;
  color: string;
  tooltipValue: string;
}>;

export type PortfolioAllocationDonutCard = Readonly<{
  portfolioId: string;
  portfolioName: string;
  totalValueLabel: string;
  asOf: string | null;
  isPartial: boolean;
  missingQuotes: number;
  missingFx: number;
  slices: readonly PortfolioAllocationDonutSlice[];
}>;

type Input = Readonly<{
  portfolios: readonly PortfolioOption[];
  baseCurrency: CurrencyCode;
}>;

const categoryOrder = [
  "REAL_ESTATE",
  "EQUITIES",
  "FIXED_INCOME",
  "CASH",
  "OTHER",
] as const satisfies readonly AllocationCategoryKey[];

const categoryLabels: Readonly<Record<AllocationCategoryKey, string>> = {
  REAL_ESTATE: "Nieruchomości",
  EQUITIES: "Akcje",
  FIXED_INCOME: "Lokaty i Obligacje",
  CASH: "Gotówka",
  OTHER: "Inne",
};

const categoryColors: Readonly<Record<AllocationCategoryKey, string>> = {
  REAL_ESTATE: "#1f4e79",
  EQUITIES: "#1f2430",
  FIXED_INCOME: "#8a5a14",
  CASH: "#17603d",
  OTHER: "#8b1e3f",
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

const mapCustomAssetTypeToCategory = (
  customAssetType: CustomAssetType | null
): AllocationCategoryKey => {
  if (customAssetType === "REAL_ESTATE") return "REAL_ESTATE";
  if (
    customAssetType === "TREASURY_BONDS" ||
    customAssetType === "TERM_DEPOSIT" ||
    customAssetType === "PRIVATE_LOAN"
  ) {
    return "FIXED_INCOME";
  }

  if (
    customAssetType === "CAR" ||
    customAssetType === "COMPUTER" ||
    customAssetType === "OTHER"
  ) {
    return "OTHER";
  }

  return "OTHER";
};

const resolveHoldingCategory = (holding: ValuedHolding): AllocationCategoryKey => {
  if (holding.provider === "custom" || holding.symbol === "CUSTOM") {
    return mapCustomAssetTypeToCategory(holding.customAssetType ?? null);
  }

  if (holding.instrumentType === "CURRENCY") {
    return "CASH";
  }

  return "EQUITIES";
};

const buildCategoryAggregates = (
  holdings: readonly ValuedHolding[]
): Record<AllocationCategoryKey, AllocationCategoryAggregate> => {
  const aggregates: Record<
    AllocationCategoryKey,
    { share: number; valueBase: ReturnType<typeof decimalZero> }
  > = {
    REAL_ESTATE: { share: 0, valueBase: decimalZero() },
    EQUITIES: { share: 0, valueBase: decimalZero() },
    FIXED_INCOME: { share: 0, valueBase: decimalZero() },
    CASH: { share: 0, valueBase: decimalZero() },
    OTHER: { share: 0, valueBase: decimalZero() },
  };

  holdings.forEach((holding) => {
    if (holding.weight === null || holding.valueBase === null) return;

    const parsedValue = parseDecimalString(holding.valueBase);
    if (!parsedValue) return;

    const category = resolveHoldingCategory(holding);
    aggregates[category].share += Math.max(0, holding.weight);
    aggregates[category].valueBase = addDecimals(aggregates[category].valueBase, parsedValue);
  });

  return {
    REAL_ESTATE: {
      share: aggregates.REAL_ESTATE.share,
      valueBase: aggregates.REAL_ESTATE.valueBase.toString(),
    },
    EQUITIES: {
      share: aggregates.EQUITIES.share,
      valueBase: aggregates.EQUITIES.valueBase.toString(),
    },
    FIXED_INCOME: {
      share: aggregates.FIXED_INCOME.share,
      valueBase: aggregates.FIXED_INCOME.valueBase.toString(),
    },
    CASH: {
      share: aggregates.CASH.share,
      valueBase: aggregates.CASH.valueBase.toString(),
    },
    OTHER: {
      share: aggregates.OTHER.share,
      valueBase: aggregates.OTHER.valueBase.toString(),
    },
  };
};

export async function getPortfolioAllocationDonutCards(
  supabase: SupabaseServerClient,
  input: Input
): Promise<readonly PortfolioAllocationDonutCard[]> {
  const formatter = getCurrencyFormatter(input.baseCurrency);

  return await Promise.all(
      input.portfolios.map(async (portfolio) => {
        const summary = await getPortfolioSummary(supabase, {
          portfolioId: portfolio.id,
          baseCurrency: input.baseCurrency,
        });

        const totalValueLabel =
            formatter && summary.totalValueBase
                ? formatCurrencyString(summary.totalValueBase, formatter) ?? "—"
                : "—";
        const aggregates = buildCategoryAggregates(summary.holdings);

        const slices = categoryOrder
            .map((category) => {
              const aggregate = aggregates[category];
              if (aggregate.share <= 0) return null;

              const categoryValueLabel =
                  formatter && aggregate.valueBase
                      ? formatCurrencyString(aggregate.valueBase, formatter) ?? "—"
                      : "—";

              return {
                id: category,
                label: categoryLabels[category],
                share: aggregate.share,
                color: categoryColors[category],
                tooltipValue: `${formatPercent(aggregate.share)} · ${categoryValueLabel}`,
              } satisfies PortfolioAllocationDonutSlice;
            })
            .filter((slice): slice is PortfolioAllocationDonutSlice => slice !== null)
            .sort((a, b) => b.share - a.share);

        return {
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          totalValueLabel,
          asOf: summary.asOf,
          isPartial: summary.isPartial,
          missingQuotes: summary.missingQuotes,
          missingFx: summary.missingFx,
          slices,
        } satisfies PortfolioAllocationDonutCard;
      })
  );
}
