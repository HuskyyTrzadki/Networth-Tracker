#!/usr/bin/env node

import { runCompaniesMarketCapBatch } from "./lib/companiesmarketcap-batch-core.mjs";

runCompaniesMarketCapBatch(process.argv.slice(2)).catch((error) => {
  console.error("[cmc] fatal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
