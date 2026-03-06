import type { InstrumentSearchResult } from "../lib/instrument-search";
import type { FormValues } from "../components/AddTransactionDialogContent";
import { resolvePortfolioSelection } from "./resolve-portfolio-selection";
import {
  buildCashInstrument,
  isSupportedCashCurrency,
} from "../lib/system-currencies";
import { getUserPortfoliosPrivateCached } from "@/features/portfolio/server/get-user-portfolios-private-cached";

type PortfolioOption = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

type DialogPreset = Readonly<{
  initialInstrument: InstrumentSearchResult | undefined;
  initialValues: Partial<FormValues> | undefined;
}>;

type Result =
  | Readonly<{
      status: "unauthenticated";
    }>
  | Readonly<{
      status: "empty";
    }>
  | Readonly<{
      status: "ready";
      portfolios: readonly PortfolioOption[];
      initialPortfolioId: string;
      initialInstrument: InstrumentSearchResult | undefined;
      initialValues: Partial<FormValues> | undefined;
    }>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const resolveDialogPreset = (
  preset: string | null,
  fallbackCurrency: string | null
): DialogPreset => {
  if (preset !== "cash-deposit") {
    return {
      initialInstrument: undefined,
      initialValues: undefined,
    };
  }

  const cashCurrency =
    fallbackCurrency && isSupportedCashCurrency(fallbackCurrency)
      ? fallbackCurrency
      : "PLN";

  return {
    initialInstrument: buildCashInstrument(cashCurrency),
    initialValues: {
      type: "BUY",
      cashflowType: "DEPOSIT",
      quantity: "1",
      price: "1",
      fee: "0",
    },
  };
};

export async function getCreateTransactionDialogData(
  searchParams: SearchParams
): Promise<Result> {
  const pageData = await getUserPortfoliosPrivateCached();
  if (!pageData.isAuthenticated) {
    return { status: "unauthenticated" };
  }

  const portfolioOptions = pageData.portfolios.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
  }));

  if (portfolioOptions.length === 0) {
    return { status: "empty" };
  }

  const selection = resolvePortfolioSelection({
    searchParams,
    portfolios: portfolioOptions,
  });
  const preset = getFirstParam(searchParams.preset)?.trim() ?? null;
  const selectedPortfolio =
    portfolioOptions.find((portfolio) => portfolio.id === selection.initialPortfolioId) ??
    null;
  const dialogPreset = resolveDialogPreset(
    preset,
    selectedPortfolio?.baseCurrency ?? null
  );

  return {
    status: "ready",
    portfolios: portfolioOptions,
    initialPortfolioId: selection.initialPortfolioId,
    initialInstrument: dialogPreset.initialInstrument,
    initialValues: dialogPreset.initialValues,
  };
}
