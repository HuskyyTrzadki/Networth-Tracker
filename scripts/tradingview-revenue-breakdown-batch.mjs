#!/usr/bin/env node

import { runTradingViewRevenueBreakdownBatch } from "./lib/tradingview-revenue-breakdown-batch-core.mjs";

runTradingViewRevenueBreakdownBatch(process.argv.slice(2)).catch((error) => {
  console.error("[tv-breakdown] fatal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
