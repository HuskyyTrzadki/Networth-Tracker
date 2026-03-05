#!/usr/bin/env node

import { runTradingViewRevenueSourceBatch } from "./lib/tradingview-revenue-source-batch-core.mjs";

runTradingViewRevenueSourceBatch(process.argv.slice(2)).catch((error) => {
  console.error("[tv-source] fatal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
