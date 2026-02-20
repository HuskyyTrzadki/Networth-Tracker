import {
  getNextOverlaySelection,
  normalizeOverlaysForMode,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import type { StockChartOverlay, StockChartRange, StockChartResponse } from "../server/types";

export type StockChartUiState = Readonly<{
  mode: StockChartMode;
  activeOverlays: readonly StockChartOverlay[];
  showEarningsEvents: boolean;
  showNewsEvents: boolean;
  showUserTradeEvents: boolean;
  showGlobalNewsEvents: boolean;
  showNarration: boolean;
}>;

export type StockChartUiAction =
  | { type: "set_mode"; payload: StockChartMode }
  | { type: "set_active_overlays"; payload: readonly StockChartOverlay[] }
  | { type: "set_show_earnings_events"; payload: boolean }
  | { type: "set_show_news_events"; payload: boolean }
  | { type: "set_show_user_trade_events"; payload: boolean }
  | { type: "set_show_global_news_events"; payload: boolean }
  | { type: "set_show_narration"; payload: boolean };

export const createInitialUiState = (
  initialChart: StockChartResponse
): StockChartUiState => ({
  mode: "trend",
  activeOverlays: [...initialChart.activeOverlays],
  showEarningsEvents: false,
  showNewsEvents: true,
  showUserTradeEvents: false,
  showGlobalNewsEvents: true,
  showNarration: true,
});

export const stockChartUiReducer = (
  state: StockChartUiState,
  action: StockChartUiAction
): StockChartUiState => {
  switch (action.type) {
    case "set_mode":
      return { ...state, mode: action.payload };
    case "set_active_overlays":
      return { ...state, activeOverlays: action.payload };
    case "set_show_earnings_events":
      return { ...state, showEarningsEvents: action.payload };
    case "set_show_news_events":
      return { ...state, showNewsEvents: action.payload };
    case "set_show_user_trade_events":
      return { ...state, showUserTradeEvents: action.payload };
    case "set_show_global_news_events":
      return { ...state, showGlobalNewsEvents: action.payload };
    case "set_show_narration":
      return { ...state, showNarration: action.payload };
    default:
      return state;
  }
};

export const isRangeDisabledOption = (
  isLoading: boolean,
  isTenYearUnavailable: boolean,
  rangeOption: StockChartRange
) => isLoading || (rangeOption === "10Y" && isTenYearUnavailable);

export const resolveNextOverlayState = (
  mode: StockChartMode,
  activeOverlays: readonly StockChartOverlay[],
  overlay: StockChartOverlay,
  enabled: boolean
) => getNextOverlaySelection(mode, activeOverlays, overlay, enabled);

export const resolveNextModeOverlayState = (
  nextMode: StockChartMode,
  activeOverlays: readonly StockChartOverlay[]
) => normalizeOverlaysForMode(nextMode, activeOverlays);
