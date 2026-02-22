#!/usr/bin/env node

import { runTradingViewRevenueGeoBatch } from "./lib/tradingview-revenue-geo-batch-core.mjs";

runTradingViewRevenueGeoBatch(process.argv.slice(2)).catch((error) => {
  console.error("[tv-geo] fatal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
