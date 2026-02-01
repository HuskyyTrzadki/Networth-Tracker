import YahooFinance from "yahoo-finance2";

// Shared Yahoo client to keep provider config consistent across features.
export const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});
