import { getPublicStockRevenueGeoCached } from "@/features/stocks/server/get-public-stock-revenue-geo-cached";
import { getPublicStockProfitConversionCached } from "@/features/stocks/server/get-public-stock-profit-conversion-cached";
import { getPublicStockRevenueSourceCached } from "@/features/stocks/server/get-public-stock-revenue-source-cached";

import StockReportRevenueMixSectionLazy from "./StockReportRevenueMixSectionLazy";
import { buildProfitConversionViewModel } from "./stock-report-profit-conversion";
import { buildRevenueGeoCardViewModel } from "./stock-report-revenue-geo";
import { buildRevenueSourceCardViewModel } from "./stock-report-revenue-source";

type Props = Readonly<{
  providerKey: string;
}>;

export default async function StockReportRevenueMixSectionSlot({
  providerKey,
}: Props) {
  const [revenueGeo, revenueSource, profitConversion] = await Promise.all([
    getPublicStockRevenueGeoCached(providerKey),
    getPublicStockRevenueSourceCached(providerKey),
    getPublicStockProfitConversionCached(providerKey),
  ]);
  const geoViewModel = buildRevenueGeoCardViewModel(revenueGeo);
  const sourceViewModel = buildRevenueSourceCardViewModel(revenueSource);
  const profitConversionViewModel = buildProfitConversionViewModel(profitConversion);

  return (
    <StockReportRevenueMixSectionLazy
      geoViewModel={geoViewModel}
      sourceViewModel={sourceViewModel}
      profitConversionViewModel={profitConversionViewModel}
    />
  );
}
