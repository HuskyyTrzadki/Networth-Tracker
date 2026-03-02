import { addDecimals, decimalZero, parseDecimalString, toFixedDecimalString } from "@/lib/decimal";
import type { EconomicCurrencyExposureApiResponse } from "@/features/portfolio/lib/currency-exposure";

import { CURRENCY_EXPOSURE_MODEL, CURRENCY_EXPOSURE_PROMPT_VERSION, CURRENCY_EXPOSURE_TOP_COUNT } from "./constants";
import { normalizeCurrencyCode } from "./normalization";
import type { CachedAssetBreakdown, CurrencyExposureScope } from "./types";
import type { PortfolioSummary } from "../valuation";

type DriverEntry = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  amount: ReturnType<typeof decimalZero>;
}>;

export function buildWeightedEconomicCurrencyExposure(
  summary: PortfolioSummary,
  assetBreakdown: readonly CachedAssetBreakdown[],
  scope: CurrencyExposureScope,
  portfolioId: string | null,
  fromCache: boolean
): EconomicCurrencyExposureApiResponse {
  const splitByInstrument = new Map(assetBreakdown.map((row) => [row.instrumentId, row]));
  const currencyTotals = new Map<string, ReturnType<typeof decimalZero>>();
  const currencyDrivers = new Map<string, Map<string, DriverEntry>>();

  const totalValue = summary.holdings.reduce((acc, holding) => {
    if (holding.missingReason || !holding.valueBase) return acc;

    const value = parseDecimalString(holding.valueBase);
    if (!value || !value.gt(0)) return acc;

    const split = splitByInstrument.get(holding.instrumentId)?.currencyExposure ?? [
      {
        currencyCode: normalizeCurrencyCode(holding.currency),
        sharePct: 100,
      },
    ];

    split.forEach((entry) => {
      const ratio = parseDecimalString(entry.sharePct / 100);
      if (!ratio || !ratio.gt(0)) return;

      const amount = value.times(ratio);
      const currencyCode = normalizeCurrencyCode(entry.currencyCode);
      currencyTotals.set(
        currencyCode,
        addDecimals(currencyTotals.get(currencyCode) ?? decimalZero(), amount)
      );

      const existingDrivers = currencyDrivers.get(currencyCode) ?? new Map<string, DriverEntry>();
      const currentDriver = existingDrivers.get(holding.instrumentId);

      existingDrivers.set(holding.instrumentId, {
        instrumentId: holding.instrumentId,
        symbol: holding.symbol,
        name: holding.name,
        amount: addDecimals(currentDriver?.amount ?? decimalZero(), amount),
      });
      currencyDrivers.set(currencyCode, existingDrivers);
    });

    return addDecimals(acc, value);
  }, decimalZero());

  if (!totalValue.gt(0)) {
    return {
      scope,
      portfolioId,
      asOf: summary.asOf,
      modelMode: "ECONOMIC",
      status: "READY",
      chart: [],
      details: [],
      meta: {
        model: CURRENCY_EXPOSURE_MODEL,
        promptVersion: CURRENCY_EXPOSURE_PROMPT_VERSION,
        fromCache,
      },
    };
  }

  const sortedCurrencies = Array.from(currencyTotals.entries())
    .filter((entry) => entry[1].gt(0))
    .sort((left, right) => {
      if (left[1].eq(right[1])) {
        return left[0].localeCompare(right[0]);
      }
      return right[1].gt(left[1]) ? 1 : -1;
    });

  const head = sortedCurrencies.slice(0, CURRENCY_EXPOSURE_TOP_COUNT);
  const tail = sortedCurrencies.slice(CURRENCY_EXPOSURE_TOP_COUNT);

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
    const detailMap = new Map<string, DriverEntry>();

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
      .filter((entry) => entry.amount.gt(0))
      .sort((left, right) => {
        if (left.amount.eq(right.amount)) {
          return left.symbol.localeCompare(right.symbol);
        }
        return right.amount.gt(left.amount) ? 1 : -1;
      })
      .slice(0, 3)
      .map((entry) => ({
        instrumentId: entry.instrumentId,
        symbol: entry.symbol,
        name: entry.name,
        contributionPct: Number(entry.amount.div(totalValue).times(100).toString()),
        contributionWithinCurrencyPct: currencyAmount.gt(0)
          ? Number(entry.amount.div(currencyAmount).times(100).toString())
          : 0,
        contributionValueBase: toFixedDecimalString(entry.amount, 2),
      }));

    return {
      currencyCode: chartRow.currencyCode,
      drivers,
    };
  });

  return {
    scope,
    portfolioId,
    asOf: summary.asOf,
    modelMode: "ECONOMIC",
    status: "READY",
    chart,
    details,
    meta: {
      model: CURRENCY_EXPOSURE_MODEL,
      promptVersion: CURRENCY_EXPOSURE_PROMPT_VERSION,
      fromCache,
    },
  };
}
