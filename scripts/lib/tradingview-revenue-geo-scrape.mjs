import { scrapeInstrumentRevenueBreakdown } from "./tradingview-revenue-breakdown-scrape.mjs";

export const scrapeInstrumentRevenueGeo = async (input) => {
  const result = await scrapeInstrumentRevenueBreakdown({
    ...input,
    kind: "geo",
  });

  return {
    ...result,
    countriesCount: result.rowsCount,
  };
};
