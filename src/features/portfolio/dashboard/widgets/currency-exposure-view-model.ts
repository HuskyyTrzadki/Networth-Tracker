import { addDecimals, decimalZero, parseDecimalString, toFixedDecimalString } from "@/lib/decimal";
import type {
  CurrencyExposureChartRow,
  CurrencyExposureDetailsRow,
} from "@/features/portfolio/lib/currency-exposure";
import type { PortfolioSummary } from "../../server/valuation";

const CHART_TOP_COUNT = 6;

type DriverSeed = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  amount: ReturnType<typeof decimalZero>;
}>;

const normalizeCurrencyCode = (value: string) => {
  const upper = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : "OTHER";
};

const buildChartAndDetails = (
  currencyTotals: ReadonlyMap<string, ReturnType<typeof decimalZero>>,
  currencyDrivers: ReadonlyMap<string, Map<string, DriverSeed>>,
  totalValue: ReturnType<typeof decimalZero>
): Readonly<{
  chart: readonly CurrencyExposureChartRow[];
  details: readonly CurrencyExposureDetailsRow[];
}> => {
  if (!totalValue.gt(0)) {
    return { chart: [], details: [] };
  }

  const sortedCurrencies = Array.from(currencyTotals.entries())
    .filter((entry) => entry[1].gt(0))
    .sort((left, right) => {
      if (left[1].eq(right[1])) {
        return left[0].localeCompare(right[0]);
      }
      return right[1].gt(left[1]) ? 1 : -1;
    });

  const head = sortedCurrencies.slice(0, CHART_TOP_COUNT);
  const tail = sortedCurrencies.slice(CHART_TOP_COUNT);

  const chart = head.map(([currencyCode, amount]) => ({
    currencyCode,
    sharePct: Number(amount.div(totalValue).times(100).toString()),
    valueBase: toFixedDecimalString(amount, 2),
  }));

  if (tail.length > 0) {
    const tailAmount = tail.reduce(
      (acc, [, amount]) => addDecimals(acc, amount),
      decimalZero()
    );

    chart.push({
      currencyCode: "INNE",
      sharePct: Number(tailAmount.div(totalValue).times(100).toString()),
      valueBase: toFixedDecimalString(tailAmount, 2),
    });
  }

  const tailCodes = new Set(tail.map(([currencyCode]) => currencyCode));

  const details = chart.map((chartRow) => {
    const detailMap = new Map<string, DriverSeed>();

    if (chartRow.currencyCode === "INNE") {
      tailCodes.forEach((currencyCode) => {
        const drivers = currencyDrivers.get(currencyCode);
        drivers?.forEach((driver) => {
          const current = detailMap.get(driver.instrumentId);
          detailMap.set(driver.instrumentId, {
            ...driver,
            amount: addDecimals(current?.amount ?? decimalZero(), driver.amount),
          });
        });
      });
    } else {
      const drivers = currencyDrivers.get(chartRow.currencyCode);
      drivers?.forEach((driver) => {
        detailMap.set(driver.instrumentId, driver);
      });
    }

    const currencyAmount = parseDecimalString(chartRow.valueBase) ?? decimalZero();

    const drivers = Array.from(detailMap.values())
      .filter((driver) => driver.amount.gt(0))
      .sort((left, right) => {
        if (left.amount.eq(right.amount)) {
          return left.symbol.localeCompare(right.symbol);
        }
        return right.amount.gt(left.amount) ? 1 : -1;
      })
      .slice(0, 3)
      .map((driver) => ({
        instrumentId: driver.instrumentId,
        symbol: driver.symbol,
        name: driver.name,
        contributionPct: Number(driver.amount.div(totalValue).times(100).toString()),
        contributionWithinCurrencyPct: currencyAmount.gt(0)
          ? Number(driver.amount.div(currencyAmount).times(100).toString())
          : 0,
        contributionValueBase: toFixedDecimalString(driver.amount, 2),
      }));

    return {
      currencyCode: chartRow.currencyCode,
      drivers,
    };
  });

  return { chart, details };
};

export function buildInvestorCurrencyExposure(summary: PortfolioSummary): Readonly<{
  chart: readonly CurrencyExposureChartRow[];
  details: readonly CurrencyExposureDetailsRow[];
}> {
  const currencyTotals = new Map<string, ReturnType<typeof decimalZero>>();
  const currencyDrivers = new Map<string, Map<string, DriverSeed>>();

  const totalValue = summary.holdings.reduce((acc, holding) => {
    if (holding.missingReason || !holding.valueBase) return acc;

    const value = parseDecimalString(holding.valueBase);
    if (!value || !value.gt(0)) return acc;

    const currencyCode = normalizeCurrencyCode(holding.currency);
    currencyTotals.set(currencyCode, addDecimals(currencyTotals.get(currencyCode) ?? decimalZero(), value));

    const existingDrivers = currencyDrivers.get(currencyCode) ?? new Map<string, DriverSeed>();
    const currentDriver = existingDrivers.get(holding.instrumentId);

    existingDrivers.set(holding.instrumentId, {
      instrumentId: holding.instrumentId,
      symbol: holding.symbol,
      name: holding.name,
      amount: addDecimals(currentDriver?.amount ?? decimalZero(), value),
    });

    currencyDrivers.set(currencyCode, existingDrivers);

    return addDecimals(acc, value);
  }, decimalZero());

  return buildChartAndDetails(currencyTotals, currencyDrivers, totalValue);
}

export const __test__ = {
  buildChartAndDetails,
  normalizeCurrencyCode,
};
