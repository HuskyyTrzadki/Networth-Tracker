import type {
  StockScreenerCard,
  StockScreenerPreviewRange,
} from "../server/types";

import { resolveScreenerPreviewData } from "./stock-screener-preview-range";

export type StockScreenerMonitoringItem = Readonly<{
  card: StockScreenerCard;
  previewData: StockScreenerCard["previewChart"];
  changePercent: number | null;
  trend: "up" | "down" | "flat";
  moveLabel: string;
  badges: readonly string[];
  isOnDip: boolean;
  source: "portfolio" | "watchlist";
  signalLabel: string;
}>;

export type StockScreenerMonitoringSections = Readonly<{
  lead: StockScreenerMonitoringItem | null;
  portfolio: readonly StockScreenerMonitoringItem[];
  watchlist: readonly StockScreenerMonitoringItem[];
  dipCount: number;
  holdingCount: number;
  watchlistCount: number;
}>;

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const resolveTrend = (
  value: number | null
): StockScreenerMonitoringItem["trend"] => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "flat";
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
};

const formatMoveLabel = (
  range: StockScreenerPreviewRange,
  value: number | null
) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Brak zmiany";
  return `${range} ${percentFormatter.format(value)}`;
};

const compareByMovement = (
  left: StockScreenerMonitoringItem,
  right: StockScreenerMonitoringItem
) => {
  if (left.isOnDip !== right.isOnDip) return left.isOnDip ? -1 : 1;

  if (left.changePercent !== null && right.changePercent !== null) {
    if (left.changePercent < 0 && right.changePercent < 0) {
      if (left.changePercent !== right.changePercent) {
        return left.changePercent - right.changePercent;
      }
    } else {
      const leftMagnitude = Math.abs(left.changePercent);
      const rightMagnitude = Math.abs(right.changePercent);
      if (leftMagnitude !== rightMagnitude) return rightMagnitude - leftMagnitude;
    }
  } else if (left.changePercent !== right.changePercent) {
    return left.changePercent === null ? 1 : -1;
  }

  if (left.card.isFavorite !== right.card.isFavorite) {
    return left.card.isFavorite ? -1 : 1;
  }

  return left.card.symbol.localeCompare(right.card.symbol, "pl-PL");
};

const resolveSignalLabel = (
  item: StockScreenerMonitoringItem,
  range: StockScreenerPreviewRange
) => {
  if (item.source === "portfolio" && item.isOnDip) {
    return `Największy spadek w portfelu (${range})`;
  }

  if (item.source === "portfolio") return `Najmocniejszy ruch w portfelu (${range})`;
  if (item.isOnDip) return `Spadek do obserwacji (${range})`;
  return `Najmocniejszy ruch z obserwowanych (${range})`;
};

const toMonitoringItem = (
  card: StockScreenerCard,
  range: StockScreenerPreviewRange
): StockScreenerMonitoringItem => {
  const preview = resolveScreenerPreviewData(card.previewChart, range);
  const trend = resolveTrend(preview.changePercent);
  const badges = [
    ...(card.inPortfolio ? ["W portfelu"] : []),
    ...(card.isFavorite && !card.inPortfolio ? ["Obserwowane"] : []),
    ...(card.isFavorite && card.inPortfolio ? ["Obserwowane"] : []),
  ];

  const source = card.inPortfolio ? "portfolio" : "watchlist";

  return {
    card,
    previewData: preview.data,
    changePercent: preview.changePercent,
    trend,
    moveLabel: formatMoveLabel(range, preview.changePercent),
    badges,
    isOnDip:
      typeof preview.changePercent === "number" &&
      Number.isFinite(preview.changePercent) &&
      preview.changePercent < 0,
    source,
    signalLabel: "",
  };
};

export const buildStockScreenerMonitoringSections = (
  cards: readonly StockScreenerCard[],
  range: StockScreenerPreviewRange
): StockScreenerMonitoringSections => {
  const itemsBase = cards.map((card) => toMonitoringItem(card, range));
  const portfolio = itemsBase
    .filter((item) => item.source === "portfolio")
    .sort(compareByMovement);
  const watchlist = itemsBase
    .filter((item) => item.source === "watchlist")
    .sort(compareByMovement);

  const leadBase = portfolio[0] ?? watchlist[0] ?? null;
  const lead = leadBase
    ? { ...leadBase, signalLabel: resolveSignalLabel(leadBase, range) }
    : null;

  return {
    lead,
    portfolio: portfolio.map((item) => ({
      ...item,
      signalLabel: resolveSignalLabel(item, range),
    })),
    watchlist: watchlist.map((item) => ({
      ...item,
      signalLabel: resolveSignalLabel(item, range),
    })),
    dipCount: portfolio.filter((item) => item.isOnDip).length,
    holdingCount: portfolio.length,
    watchlistCount: watchlist.length,
  };
};
