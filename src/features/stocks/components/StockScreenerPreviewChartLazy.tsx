import type { StockScreenerPreviewPoint } from "./StockScreenerPreviewChart";
import { StockScreenerPreviewChart } from "./StockScreenerPreviewChart";

export function StockScreenerPreviewChartLazy({
  data,
  currency,
  className,
}: Readonly<{
  data: readonly StockScreenerPreviewPoint[];
  currency: string;
  className?: string;
}>) {
  return (
    <StockScreenerPreviewChart
      data={data}
      currency={currency}
      className={className}
    />
  );
}
