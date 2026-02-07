import { cn } from "@/lib/cn";

export const SHARED_PORTFOLIO_CHART_HEIGHT = 360;
export const SHARED_PORTFOLIO_WIDGET_MIN_HEIGHT_CLASS = "min-h-[560px]";

const SHARED_PORTFOLIO_CHART_EMPTY_STATE_CLASS_NAME =
  "grid h-[360px] place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground";

export const getPortfolioChartEmptyStateClassName = (
  shouldBootstrap: boolean
) =>
  cn(
    SHARED_PORTFOLIO_CHART_EMPTY_STATE_CLASS_NAME,
    shouldBootstrap ? "animate-pulse" : ""
  );
