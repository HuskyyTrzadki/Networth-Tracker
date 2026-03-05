import {
  processTradingViewRevenueBreakdownInstruments,
  runTradingViewRevenueBreakdownBatch,
} from "./tradingview-revenue-breakdown-batch-core.mjs";

export const processTradingViewRevenueSourceInstruments = async (input) =>
  processTradingViewRevenueBreakdownInstruments({
    ...input,
    kind: "source",
  });

export const runTradingViewRevenueSourceBatch = async (argv) =>
  runTradingViewRevenueBreakdownBatch(["--kind=source", ...argv]);
