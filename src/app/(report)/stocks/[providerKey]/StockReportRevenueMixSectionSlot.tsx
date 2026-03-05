import { getPublicStockRevenueGeoCached } from "@/features/stocks/server/get-public-stock-revenue-geo-cached";

import StockReportRevenueMixSectionLazy from "./StockReportRevenueMixSectionLazy";
import { buildRevenueGeoCardViewModel } from "./stock-report-revenue-geo";

type Props = Readonly<{
  providerKey: string;
}>;

export default async function StockReportRevenueMixSectionSlot({
  providerKey,
}: Props) {
  const revenueGeo = await getPublicStockRevenueGeoCached(providerKey);
  const geoViewModel = buildRevenueGeoCardViewModel(revenueGeo);

  return <StockReportRevenueMixSectionLazy geoViewModel={geoViewModel} />;
}
