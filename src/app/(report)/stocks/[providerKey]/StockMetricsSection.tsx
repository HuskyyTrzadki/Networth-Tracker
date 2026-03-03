import { cacheLife, cacheTag } from "next/cache";

import { getPublicStockSummaryCached } from "@/features/stocks/server/get-public-stock-summary-cached";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { getStockValuationHistory } from "@/features/stocks/server/get-stock-valuation-history";
import { buildStockValuationRangeContext } from "@/features/stocks/server/valuation-range-context";

import { InvestorTakeaway } from "./ReportPrimitives";

export default async function StockMetricsSection({
  providerKey,
  metricCurrency,
}: Readonly<{
  providerKey: string;
  metricCurrency: string;
}>) {
  const [summary, valuationHistory] = await Promise.all([
    getPublicStockSummaryCached(providerKey),
    getStockValuationHistoryCached(providerKey),
  ]);
  const valuationContexts = {
    peTtm: buildStockValuationRangeContext({
      metric: "peTtm",
      current: summary.peTtm,
      historyPoints: valuationHistory.points,
      resolvedRange: valuationHistory.resolvedRange,
    }),
    priceToSales: buildStockValuationRangeContext({
      metric: "priceToSales",
      current: summary.priceToSales,
      historyPoints: valuationHistory.points,
      resolvedRange: valuationHistory.resolvedRange,
    }),
    priceToBook: buildStockValuationRangeContext({
      metric: "priceToBook",
      current: summary.priceToBook,
      historyPoints: valuationHistory.points,
      resolvedRange: valuationHistory.resolvedRange,
    }),
  } as const;

  return (
    <div className="space-y-4">
      <StockMetricsGrid
        summary={summary}
        currency={metricCurrency}
        valuationContexts={valuationContexts}
      />
      <InvestorTakeaway>
        Tu sprawdzasz dwie rzeczy: czy biznes nadal rośnie z dobra marza i czy cena nie
        zaklada juz zbyt wiele dobrych wiadomosci z gory.
      </InvestorTakeaway>
    </div>
  );
}

const getStockValuationHistoryCached = async (providerKey: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:chart:5y:valuation`);
  cacheTag(`stock:${providerKey}:summary`);
  cacheTag(`stock:${providerKey}:fundamentals`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockValuationHistory(supabase, providerKey, "5Y");
};
