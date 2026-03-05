import { getPublicStockRevenueGeoCached } from "@/features/stocks/server/get-public-stock-revenue-geo-cached";
import { getPublicStockRevenueSourceCached } from "@/features/stocks/server/get-public-stock-revenue-source-cached";

import StockReportRevenueMixSectionLazy from "./StockReportRevenueMixSectionLazy";
import { buildRevenueGeoCardViewModel } from "./stock-report-revenue-geo";
import { buildRevenueSourceCardViewModel } from "./stock-report-revenue-source";

type Props = Readonly<{
  providerKey: string;
}>;

export default async function StockReportRevenueMixSectionSlot({
  providerKey,
}: Props) {
  const [revenueGeo, revenueSource] = await Promise.all([
    getPublicStockRevenueGeoCached(providerKey),
    getPublicStockRevenueSourceCached(providerKey),
  ]);
  const geoViewModel = buildRevenueGeoCardViewModel(revenueGeo);
  const sourceViewModel = buildRevenueSourceCardViewModel(revenueSource);

  return (
    <StockReportRevenueMixSectionLazy
      geoViewModel={geoViewModel}
      sourceViewModel={sourceViewModel}
    />
  );
}
