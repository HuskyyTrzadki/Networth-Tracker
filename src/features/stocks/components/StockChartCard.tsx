"use client";

import { useEffect, useReducer, useState } from "react";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";
import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";
import { LoaderCircle } from "lucide-react";

import { getStockChart } from "../client/get-stock-chart";
import { getStockTradeMarkers } from "../client/get-stock-trade-markers";
import {
  OVERLAY_CONTROL_LABELS,
  OVERLAY_KEYS,
  buildOverlayAxisMeta,
  buildLegendItems,
  buildPriceAxisDomain,
  buildChartData,
  buildCoverageWarnings,
  getNextOverlaySelection,
  normalizeOverlaysForMode,
  toOverlayRequestKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import { buildMockChartEventMarkers } from "./stock-chart-event-markers";
import { StockChartPlot } from "./StockChartPlot";
import { getPriceTrendColor, resolveStockPriceTrend } from "./stock-chart-trend";
import {
  formatChangePercent,
  resolveVisibleTradeMarkers,
} from "./stock-chart-card-view-model";
import {
  STOCK_CHART_RANGES,
  type StockChartOverlay,
  type StockChartRange,
  type StockChartResponse,
  type StockTradeMarker,
} from "../server/types";

type Props = Readonly<{
  providerKey: string;
  initialChart: StockChartResponse;
}>;

type UiState = Readonly<{
  mode: StockChartMode;
  activeOverlays: readonly StockChartOverlay[];
  showEarningsEvents: boolean;
  showNewsEvents: boolean;
  showUserTradeEvents: boolean;
  showGlobalNewsEvents: boolean;
  showNarration: boolean;
}>;

type UiAction =
  | { type: "set_mode"; payload: StockChartMode }
  | { type: "set_active_overlays"; payload: readonly StockChartOverlay[] }
  | { type: "set_show_earnings_events"; payload: boolean }
  | { type: "set_show_news_events"; payload: boolean }
  | { type: "set_show_user_trade_events"; payload: boolean }
  | { type: "set_show_global_news_events"; payload: boolean }
  | { type: "set_show_narration"; payload: boolean };

const createInitialUiState = (
  initialChart: StockChartResponse
): UiState => ({
  mode: "trend",
  activeOverlays: [...initialChart.activeOverlays],
  showEarningsEvents: false,
  showNewsEvents: true,
  showUserTradeEvents: false,
  showGlobalNewsEvents: true,
  showNarration: true,
});

const uiReducer = (state: UiState, action: UiAction): UiState => {
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

const isRangeDisabledOption = (
  isLoading: boolean,
  isTenYearUnavailable: boolean,
  rangeOption: StockChartRange
) => isLoading || (rangeOption === "10Y" && isTenYearUnavailable);

const resolveNextOverlayState = (
  mode: StockChartMode,
  activeOverlays: readonly StockChartOverlay[],
  overlay: StockChartOverlay,
  enabled: boolean
) => getNextOverlaySelection(mode, activeOverlays, overlay, enabled);

const resolveNextModeOverlayState = (
  nextMode: StockChartMode,
  activeOverlays: readonly StockChartOverlay[]
) => normalizeOverlaysForMode(nextMode, activeOverlays);

function StockChartOverlayEventsPanel({
  resolvedRange,
  normalizedOverlays,
  mode,
  isLoading,
  isEventRangeEligible,
  showNarration,
  showEarningsEvents,
  showNewsEvents,
  showUserTradeEvents,
  showGlobalNewsEvents,
  onToggleOverlay,
  onToggleNarration,
  onToggleEarnings,
  onToggleNews,
  onToggleUserTrades,
  onToggleGlobalNews,
}: Readonly<{
  resolvedRange: StockChartRange;
  normalizedOverlays: readonly StockChartOverlay[];
  mode: StockChartMode;
  isLoading: boolean;
  isEventRangeEligible: boolean;
  showNarration: boolean;
  showEarningsEvents: boolean;
  showNewsEvents: boolean;
  showUserTradeEvents: boolean;
  showGlobalNewsEvents: boolean;
  onToggleOverlay: (overlay: StockChartOverlay, enabled: boolean) => void;
  onToggleNarration: (enabled: boolean) => void;
  onToggleEarnings: (enabled: boolean) => void;
  onToggleNews: (enabled: boolean) => void;
  onToggleUserTrades: (enabled: boolean) => void;
  onToggleGlobalNews: (enabled: boolean) => void;
}>) {
  if (resolvedRange === "1D") return null;

  return (
    <div className="rounded-md border border-border/60 bg-card/35 p-2.5">
      <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
        Nakładki i wydarzenia
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {OVERLAY_KEYS.map((overlay) => (
          <OverlayToggleChip
            key={overlay}
            label={OVERLAY_CONTROL_LABELS[overlay]}
            active={normalizedOverlays.includes(overlay)}
            disabled={isLoading || (mode === "raw" && overlay === "revenueTtm")}
            onToggle={(enabled) => onToggleOverlay(overlay, enabled)}
          />
        ))}
        <span className="h-5 w-px bg-border/60" aria-hidden />
        <OverlayToggleChip
          label="Narracja"
          active={isEventRangeEligible ? showNarration : false}
          disabled={!isEventRangeEligible}
          onToggle={onToggleNarration}
        />
        <OverlayToggleChip
          label="Wyniki (konsensus vs raport)"
          active={isEventRangeEligible ? showEarningsEvents : false}
          disabled={!isEventRangeEligible}
          onToggle={onToggleEarnings}
        />
        <OverlayToggleChip
          label="Wazne wydarzenia"
          active={isEventRangeEligible ? showNewsEvents : false}
          disabled={!isEventRangeEligible}
          onToggle={onToggleNews}
        />
        <OverlayToggleChip
          label="BUY/SELL uzytkownika (mock)"
          active={isEventRangeEligible ? showUserTradeEvents : false}
          disabled={!isEventRangeEligible}
          onToggle={onToggleUserTrades}
        />
        <OverlayToggleChip
          label="Wazne wydarzenia globalne"
          active={isEventRangeEligible ? showGlobalNewsEvents : false}
          disabled={!isEventRangeEligible}
          onToggle={onToggleGlobalNews}
        />
      </div>
    </div>
  );
}

function OverlayToggleChip({
  label,
  active,
  disabled,
  onToggle,
}: Readonly<{
  label: string;
  active: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
}>) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn(
        "h-7 rounded-sm px-2.5 text-[11px]",
        active
          ? "border-transparent bg-foreground text-background hover:bg-foreground"
          : "border-border/70 bg-transparent text-muted-foreground hover:text-foreground"
      )}
      disabled={disabled}
      onClick={() => onToggle(!active)}
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}

function StockChartCardHeader({
  direction,
  changePercent,
}: Readonly<{
  direction: "up" | "down" | "flat";
  changePercent: number | null;
}>) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="text-2xl font-semibold tracking-tight">Wykres ceny</h2>
      <p
        className={cn(
          "font-mono text-[11px] font-semibold tabular-nums",
          direction === "up" && "text-[color:var(--profit)]",
          direction === "down" && "text-[color:var(--loss)]",
          direction === "flat" && "text-muted-foreground"
        )}
      >
        Zmiana zakresu: {formatChangePercent(changePercent)}
      </p>
    </header>
  );
}

export function StockChartCard({ providerKey, initialChart }: Props) {
  const rangeStorageKey = `stocks:chart-range:${providerKey}`;
  const [range, setRange] = useState<StockChartRange>(() => {
    if (typeof window === "undefined") {
      return initialChart.requestedRange;
    }

    const savedRange = window.localStorage.getItem(rangeStorageKey) as StockChartRange | null;
    if (savedRange && STOCK_CHART_RANGES.includes(savedRange)) {
      return savedRange;
    }

    return initialChart.requestedRange;
  });
  const [uiState, dispatch] = useReducer(
    uiReducer,
    initialChart,
    createInitialUiState
  );
  const {
    mode,
    activeOverlays,
    showEarningsEvents,
    showNewsEvents,
    showUserTradeEvents,
    showGlobalNewsEvents,
    showNarration,
  } = uiState;

  useEffect(() => {
    window.localStorage.setItem(rangeStorageKey, range);
  }, [range, rangeStorageKey]);

  const normalizedOverlays = normalizeOverlaysForMode(mode, activeOverlays);
  const initialOverlayKey = toOverlayRequestKey(initialChart.activeOverlays);
  const overlayKey = toOverlayRequestKey(normalizedOverlays);
  const isInitialState =
    range === initialChart.requestedRange && overlayKey === initialOverlayKey;
  const requestKey = isInitialState
    ? null
    : `${providerKey}|${range}|${overlayKey || "none"}`;

  const chartResource = useKeyedAsyncResource<StockChartResponse>({
    requestKey,
    load: (signal) => getStockChart(providerKey, range, normalizedOverlays, signal),
    getErrorMessage: (error) =>
      error instanceof Error ? error.message : "Nie udało się pobrać wykresu.",
    keepPreviousData: true,
  });
  const tradeMarkersResource = useKeyedAsyncResource<readonly StockTradeMarker[]>({
    requestKey: providerKey,
    load: (signal) => getStockTradeMarkers(providerKey, signal),
    getErrorMessage: () => "",
    keepPreviousData: true,
  });

  const lastKnownChart = chartResource.data ?? initialChart;
  const shouldHideInitialFallback =
    chartResource.isLoading && chartResource.data === null && !isInitialState;
  const chart = shouldHideInitialFallback ? null : lastKnownChart;
  const isLoading = chartResource.isLoading;
  const isTenYearUnavailable =
    (chart ?? lastKnownChart).requestedRange === "10Y" &&
    (chart ?? lastKnownChart).resolvedRange !== "10Y";
  const isEventRangeEligible = ["3Y", "5Y", "10Y", "ALL"].includes(
    (chart ?? lastKnownChart).resolvedRange
  );

  const toggleOverlay = (overlay: StockChartOverlay, enabled: boolean) =>
    dispatch({
      type: "set_active_overlays",
      payload: resolveNextOverlayState(mode, activeOverlays, overlay, enabled),
    });

  const switchMode = (nextMode: StockChartMode) => {
    dispatch({ type: "set_mode", payload: nextMode });
    dispatch({
      type: "set_active_overlays",
      payload: resolveNextModeOverlayState(nextMode, activeOverlays),
    });
  };

  const chartData = [...buildChartData(chart?.points ?? [])];
  const priceTrend = resolveStockPriceTrend(chartData.map((point) => point.price));
  const priceLineColor = getPriceTrendColor(priceTrend.direction);
  const priceAxisDomain =
    chart !== null ? buildPriceAxisDomain(chart.resolvedRange, chartData) : undefined;

  const hasVisibleOverlayLines =
    chart !== null &&
    normalizedOverlays.some((overlay) => chart.hasOverlayData[overlay]);

  const coverageWarnings = chart
    ? buildCoverageWarnings(chart, normalizedOverlays)
    : [];
  const legendItems =
    chart !== null
      ? buildLegendItems(mode, normalizedOverlays, chart.hasOverlayData)
      : [];
  const overlayAxisMeta =
    chart !== null
      ? buildOverlayAxisMeta(
          mode,
          chartData,
          normalizedOverlays,
          chart.hasOverlayData
        )
      : { label: null, primaryOverlay: null, domain: undefined };
  const showOverlayAxis = mode === "trend" && hasVisibleOverlayLines;
  const priceAxisDomainForChart = priceAxisDomain
    ? ([priceAxisDomain[0], priceAxisDomain[1]] as [number, number])
    : undefined;
  const overlayAxisDomainForChart = overlayAxisMeta.domain
    ? ([overlayAxisMeta.domain[0], overlayAxisMeta.domain[1]] as [number, number])
    : undefined;
  const visibleTradeMarkers = chart
    ? resolveVisibleTradeMarkers(tradeMarkersResource.data ?? [], chart.points)
    : [];
  const eventMarkers = isEventRangeEligible
    ? buildMockChartEventMarkers(chartData, {
      includeEarnings: showEarningsEvents,
      includeNews: showNarration && showNewsEvents,
      includeUserTrades: showUserTradeEvents,
      includeGlobalNews: showNarration && showGlobalNewsEvents,
    })
    : [];

  return (
    <section className="space-y-4 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <StockChartCardHeader
        direction={priceTrend.direction}
        changePercent={priceTrend.changePercent}
      />

      <div className="space-y-4">
        <div className="grid gap-2 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="rounded-md border border-border/60 bg-card/45 p-2.5">
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
              Zakres
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {STOCK_CHART_RANGES.map((rangeOption) => (
                <Button
                  key={rangeOption}
                  size="sm"
                  type="button"
                  variant={range === rangeOption ? "default" : "outline"}
                  onClick={() => setRange(rangeOption)}
                  disabled={isRangeDisabledOption(
                    isLoading,
                    isTenYearUnavailable,
                    rangeOption
                  )}
                  className={cn("h-8 min-w-10 rounded-sm px-2.5 font-mono text-[11px]")}
                >
                  {rangeOption}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-card/45 p-2.5 xl:justify-self-end">
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/90">
              Tryb
            </div>
            <div className="inline-flex rounded-sm border border-border/70 p-0.5">
              <Button
                size="sm"
                type="button"
                variant={mode === "trend" ? "default" : "ghost"}
                onClick={() => switchMode("trend")}
                disabled={isLoading}
                className="h-8 rounded-sm px-3 text-xs"
              >
                Trend (100)
              </Button>
              <Button
                size="sm"
                type="button"
                variant={mode === "raw" ? "default" : "ghost"}
                onClick={() => switchMode("raw")}
                disabled={isLoading}
                className="h-8 rounded-sm px-3 text-xs"
              >
                Surowe
              </Button>
            </div>
          </div>
        </div>

        <StockChartOverlayEventsPanel
          resolvedRange={(chart ?? lastKnownChart).resolvedRange}
          normalizedOverlays={normalizedOverlays}
          mode={mode}
          isLoading={isLoading}
          isEventRangeEligible={isEventRangeEligible}
          showNarration={showNarration}
          showEarningsEvents={showEarningsEvents}
          showNewsEvents={showNewsEvents}
          showUserTradeEvents={showUserTradeEvents}
          showGlobalNewsEvents={showGlobalNewsEvents}
          onToggleOverlay={toggleOverlay}
          onToggleNarration={(enabled) =>
            dispatch({ type: "set_show_narration", payload: enabled })
          }
          onToggleEarnings={(enabled) =>
            dispatch({ type: "set_show_earnings_events", payload: enabled })
          }
          onToggleNews={(enabled) =>
            dispatch({ type: "set_show_news_events", payload: enabled })
          }
          onToggleUserTrades={(enabled) =>
            dispatch({ type: "set_show_user_trade_events", payload: enabled })
          }
          onToggleGlobalNews={(enabled) =>
            dispatch({ type: "set_show_global_news_events", payload: enabled })
          }
        />

        {mode === "raw" ? (
          <p className="text-xs text-muted-foreground">
            W trybie Surowe mozna porownac tylko jeden overlay naraz (PE lub EPS
            TTM).
          </p>
        ) : null}

        {isLoading ? (
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Pobieram dane dla zakresu {range}...
          </div>
        ) : null}

        {(chart ?? lastKnownChart).requestedRange === "1D" &&
        (chart ?? lastKnownChart).resolvedRange !== "1D" ? (
          <p className="text-xs text-muted-foreground">
            Brak danych intraday. Pokazano zakres 1M.
          </p>
        ) : null}
        {(chart ?? lastKnownChart).requestedRange === "10Y" &&
        (chart ?? lastKnownChart).resolvedRange !== "10Y" ? (
          <p className="text-xs text-muted-foreground">
            Brak pełnej historii 10Y. Pokazano pełny dostępny zakres.
          </p>
        ) : null}

        {coverageWarnings.length > 0 ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Niepełne pokrycie danych: {coverageWarnings.join(" · ")}
          </p>
        ) : null}

        {chartResource.errorMessage ? (
          <p className="text-sm text-loss">{chartResource.errorMessage}</p>
        ) : null}

        {legendItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {legendItems.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}

        <StockChartPlot
          chart={chart}
          chartData={chartData}
          normalizedOverlays={normalizedOverlays}
          mode={mode}
          priceTrendDirection={priceTrend.direction}
          priceLineColor={priceLineColor}
          showOverlayAxis={showOverlayAxis}
          priceAxisDomainForChart={priceAxisDomainForChart}
          overlayAxisDomainForChart={overlayAxisDomainForChart}
          overlayAxisLabel={overlayAxisMeta.label}
          visibleTradeMarkers={visibleTradeMarkers}
          eventMarkers={eventMarkers}
          showNarrativeLabels={showNarration && isEventRangeEligible}
          isLoading={isLoading}
        />

        {chart !== null &&
        normalizedOverlays.some((overlay) => !chart.hasOverlayData[overlay]) ? (
          <p className="text-xs text-muted-foreground">
            Część overlayów jest niedostępna dla tej spółki lub zakresu danych.
          </p>
        ) : null}

      </div>
    </section>
  );
}
