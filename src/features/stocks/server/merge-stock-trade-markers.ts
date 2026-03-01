import type {
  StockTradeMarker,
  StockTradeMarkerPortfolioSummary,
  StockTradeMarkerTrade,
} from "./types";

type PortfolioAccumulator = {
  portfolioId: string;
  portfolioName: string;
  buyQuantity: number;
  sellQuantity: number;
  buyNotional: number;
  sellNotional: number;
  tradeCount: number;
};

type DailyAccumulator = {
  tradeDate: string;
  buyQuantity: number;
  sellQuantity: number;
  buyNotional: number;
  sellNotional: number;
  trades: StockTradeMarkerTrade[];
  portfolios: Map<string, PortfolioAccumulator>;
};

const createDailyAccumulator = (tradeDate: string): DailyAccumulator => ({
  tradeDate,
  buyQuantity: 0,
  sellQuantity: 0,
  buyNotional: 0,
  sellNotional: 0,
  trades: [],
  portfolios: new Map(),
});

const resolvePortfolioSummary = (
  portfolio: PortfolioAccumulator
): StockTradeMarkerPortfolioSummary | null => {
  if (portfolio.buyQuantity === portfolio.sellQuantity) {
    return null;
  }

  const side = portfolio.buyQuantity > portfolio.sellQuantity ? "BUY" : "SELL";
  const netQuantity =
    side === "BUY"
      ? portfolio.buyQuantity - portfolio.sellQuantity
      : portfolio.sellQuantity - portfolio.buyQuantity;
  const grossNotional = side === "BUY" ? portfolio.buyNotional : portfolio.sellNotional;

  return {
    portfolioId: portfolio.portfolioId,
    portfolioName: portfolio.portfolioName,
    side,
    netQuantity,
    grossNotional,
    tradeCount: portfolio.tradeCount,
  };
};

export function mergeStockTradeMarkers(
  trades: readonly StockTradeMarkerTrade[]
): readonly StockTradeMarker[] {
  if (trades.length === 0) {
    return [];
  }

  const markersByDate = new Map<string, DailyAccumulator>();

  for (const trade of trades) {
    const tradeDate = trade.tradeDate;

    const existing = markersByDate.get(tradeDate) ?? createDailyAccumulator(tradeDate);
    const notional = trade.quantity * trade.price;

    if (trade.side === "BUY") {
      existing.buyQuantity += trade.quantity;
      existing.buyNotional += notional;
    } else {
      existing.sellQuantity += trade.quantity;
      existing.sellNotional += notional;
    }

    existing.trades.push(trade);

    const portfolioKey = trade.portfolioId;
    const portfolio =
      existing.portfolios.get(portfolioKey) ??
      ({
        portfolioId: trade.portfolioId,
        portfolioName: trade.portfolioName,
        buyQuantity: 0,
        sellQuantity: 0,
        buyNotional: 0,
        sellNotional: 0,
        tradeCount: 0,
      } satisfies PortfolioAccumulator);

    if (trade.side === "BUY") {
      portfolio.buyQuantity += trade.quantity;
      portfolio.buyNotional += notional;
    } else {
      portfolio.sellQuantity += trade.quantity;
      portfolio.sellNotional += notional;
    }
    portfolio.tradeCount += 1;

    existing.portfolios.set(portfolioKey, portfolio);
    markersByDate.set(tradeDate, existing);
  }

  const mergedMarkers: StockTradeMarker[] = [];

  [...markersByDate.values()]
    .sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
    .forEach((entry) => {
      if (entry.buyQuantity === entry.sellQuantity) {
        return;
      }

      const side = entry.buyQuantity > entry.sellQuantity ? "BUY" : "SELL";
      const netQuantity =
        side === "BUY"
          ? entry.buyQuantity - entry.sellQuantity
          : entry.sellQuantity - entry.buyQuantity;
      const dominantQuantity = side === "BUY" ? entry.buyQuantity : entry.sellQuantity;
      const grossNotional = side === "BUY" ? entry.buyNotional : entry.sellNotional;

      if (dominantQuantity <= 0 || !Number.isFinite(grossNotional)) {
        return;
      }

      const weightedPrice = grossNotional / dominantQuantity;
      if (!Number.isFinite(weightedPrice)) {
        return;
      }

      const portfolios = [...entry.portfolios.values()]
        .map(resolvePortfolioSummary)
        .filter((portfolio): portfolio is StockTradeMarkerPortfolioSummary => portfolio !== null)
        .sort((left, right) => right.grossNotional - left.grossNotional);

      mergedMarkers.push({
        id: `trade:${entry.tradeDate}:${side}`,
        tradeDate: entry.tradeDate,
        side,
        netQuantity,
        weightedPrice,
        grossNotional,
        buyQuantity: entry.buyQuantity,
        sellQuantity: entry.sellQuantity,
        buyNotional: entry.buyNotional,
        sellNotional: entry.sellNotional,
        tradeCount: entry.trades.length,
        portfolios,
        trades: entry.trades,
      });
    });

  return mergedMarkers;
}
