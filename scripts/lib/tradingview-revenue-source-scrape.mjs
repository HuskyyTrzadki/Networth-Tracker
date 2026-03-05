import { scrapeInstrumentRevenueBreakdown } from "./tradingview-revenue-breakdown-scrape.mjs";

export const scrapeInstrumentRevenueSource = async (input) =>
  scrapeInstrumentRevenueBreakdown({
    ...input,
    kind: "source",
  });
