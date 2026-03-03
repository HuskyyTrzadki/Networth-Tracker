"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, treemap, treemapBinary } from "d3-hierarchy";
import { WalletMinimal } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildLogoDevTickerProxyUrl } from "@/features/common/lib/logo-dev";
import type { CurrencyCode } from "@/features/market-data/types";
import { formatCurrencyString, getCurrencyFormatter } from "@/lib/format-currency";

import type { AllocationAssetRow, AllocationCategoryRow } from "./allocation-view-model";

type Props = Readonly<{
  categories: readonly AllocationCategoryRow[];
  baseCurrency: CurrencyCode;
  totalAmountLabel: string;
  totalCurrencyLabel: string | null;
}>;

type LayoutRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  data: AssetLayoutData;
}>;

type AssetLayoutData = Readonly<{
  asset: AllocationAssetRow;
  shareLabel: string;
  valueLabel: string;
  dayChangeLabel: string;
  tone: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}>;

type TreemapDatum = Readonly<{
  id: string;
  value?: number;
  assetData?: AssetLayoutData;
  children?: readonly TreemapDatum[];
}>;

const pageBackground = "#e7e3dd";
const tileBorderColor = "#d2cbbe";
const positiveTile = "#dcefe3";
const negativeTile = "#f2e2e1";
const neutralTile = "#f4f2ee";
const positiveInk = "#28382d";
const negativeInk = "#433131";
const neutralInk = "#343230";

const categoryGap = 3;
const leafGap = 2;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

const formatSignedPercent = (value: number | null, digits = 2) => {
  const absolute = new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value ?? 0));

  if (value === null || Math.abs(value) < 0.0001) return absolute;
  return value > 0 ? `+${absolute}` : `-${absolute}`;
};

const formatDirectionalChange = (value: number | null, digits = 2) => {
  const arrow = value === null || Math.abs(value) < 0.0001 ? "→" : value > 0 ? "↑" : "↓";
  return `${arrow} ${formatSignedPercent(value, digits)}`;
};

const parseValue = (value: string) => {
  const compact = value.replace(/\s+/g, "").trim();
  const normalized =
    compact.includes(",") && !compact.includes(".")
      ? compact.replace(",", ".")
      : compact.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const toNodeValue = (asset: AllocationAssetRow) => {
  const parsed = parseValue(asset.valueBase);
  if (parsed > 0) return parsed;
  if (asset.share > 0) return asset.share * 1_000_000;
  return 0;
};

const resolveTone = (value: number | null): AssetLayoutData["tone"] => {
  if (value === null || Math.abs(value) < 0.0001) return "NEUTRAL";
  return value > 0 ? "POSITIVE" : "NEGATIVE";
};

const resolveTileColors = (tone: AssetLayoutData["tone"]) => {
  if (tone === "POSITIVE") return { bg: positiveTile, text: positiveInk };
  if (tone === "NEGATIVE") return { bg: negativeTile, text: negativeInk };
  return { bg: neutralTile, text: neutralInk };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getTileTypography = (width: number, height: number) => {
  const ticker = clamp(Math.min(width / 5, height / 2.2), 11, 48);
  const change = clamp(ticker * 0.56, 10, 26);
  const icon = clamp(ticker * 0.64, 18, 32);
  return { ticker, change, icon };
};

const truncateLabel = (value: string, width: number) => {
  const maxChars = Math.max(3, Math.floor(width / 14));
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(2, maxChars - 1))}…`;
};

const resolveLogoUrl = (asset: AllocationAssetRow) => {
  if (asset.logoUrl) return asset.logoUrl;
  if (asset.isCurrencyCash || asset.symbol === "CUSTOM") return null;
  return buildLogoDevTickerProxyUrl(asset.symbol);
};

const resolveFallbackGlyph = (asset: AllocationAssetRow) => {
  if (asset.isCurrencyCash) return "cash";
  if (asset.symbol === "CUSTOM") return asset.customGlyph ?? "◼";
  return null;
};

export function AllocationTreemapView({
  categories,
  baseCurrency,
  totalAmountLabel,
  totalCurrencyLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: Math.max(0, rect.width), height: Math.max(0, rect.height) });
    };

    updateSize();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ width: Math.max(0, entry.contentRect.width), height: Math.max(0, entry.contentRect.height) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const formatter = getCurrencyFormatter(baseCurrency);

  const leaves = useMemo(() => {
    const width = size.width;
    const height = size.height;
    if (width <= 0 || height <= 0) return [] as LayoutRect[];

    const categoryNodes: TreemapDatum[] = [];

    for (const category of categories) {
      const assetNodes: TreemapDatum[] = [];

      for (const asset of category.assets) {
        const value = toNodeValue(asset);
        if (value <= 0) continue;

        assetNodes.push({
          id: asset.id,
          value,
          assetData: {
            asset,
            shareLabel: formatPercent(asset.share),
            valueLabel:
              formatter && asset.valueBase
                ? formatCurrencyString(asset.valueBase, formatter) ??
                  `${asset.valueBase} ${baseCurrency}`
                : `${asset.valueBase} ${baseCurrency}`,
            dayChangeLabel: formatDirectionalChange(
              asset.todayChangePercent,
              asset.share >= 0.03 ? 2 : 1
            ),
            tone: resolveTone(asset.todayChangePercent),
          },
        });
      }

      if (assetNodes.length > 0) {
        categoryNodes.push({
          id: category.id,
          children: assetNodes,
        });
      }
    }

    const rootData: TreemapDatum = {
      id: "portfolio",
      children: categoryNodes,
    };

    const root = hierarchy(rootData)
      .sum((node) => node.value ?? 0)
      .sort((left, right) => (right.value ?? 0) - (left.value ?? 0));

    const layout = treemap<TreemapDatum>()
      .tile(treemapBinary)
      .size([width, height])
      .round(true)
      .paddingInner((node) => (node.depth === 1 ? categoryGap : leafGap));

    const output = layout(root);
    return output
      .leaves()
      .map((leaf) => {
        const assetData = leaf.data.assetData;
        if (!assetData) return null;
        return {
          x: leaf.x0,
          y: leaf.y0,
          width: Math.max(0, leaf.x1 - leaf.x0),
          height: Math.max(0, leaf.y1 - leaf.y0),
          data: assetData,
        } satisfies LayoutRect;
      })
      .filter((value): value is LayoutRect => value !== null);
  }, [baseCurrency, categories, formatter, size.height, size.width]);

  if (categories.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
        Brak danych do alokacji
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <TooltipProvider delayDuration={120}>
        <div
          className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60 p-1"
          style={{ backgroundColor: pageBackground }}
        >
          <div className="relative h-full w-full" ref={containerRef}>
            {leaves.map((leaf) => {
              const assetData = leaf.data;
              const colors = resolveTileColors(assetData.tone);
              const { ticker, change, icon } = getTileTypography(leaf.width, leaf.height);
              const isTierTiny = leaf.width < 30 || leaf.height < 20;
              const isTierLarge = !isTierTiny && leaf.width > 60 && leaf.height > 60;
              const isTierMedium = !isTierTiny && !isTierLarge && leaf.height > 40;
              const isTierSmall = !isTierTiny && !isTierLarge && !isTierMedium && leaf.height > 20;
              const showTicker = isTierLarge || isTierMedium || isTierSmall;
              const showChange = isTierLarge || isTierMedium;
              const showIcon = isTierLarge;
              const logoUrl = resolveLogoUrl(assetData.asset);
              const fallbackGlyph = resolveFallbackGlyph(assetData.asset);

              return (
                <Tooltip key={assetData.asset.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute"
                      style={{
                        left: leaf.x,
                        top: leaf.y,
                        width: leaf.width,
                        height: leaf.height,
                      }}
                    >
                      <div
                        className="flex h-full w-full flex-col items-center justify-center text-center"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${tileBorderColor}`,
                          borderRadius: 4,
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
                          padding: 6,
                        }}
                      >
                        {showTicker ? (
                          <>
                            {showIcon ? (
                              logoUrl ? (
                                <div
                                  aria-label={assetData.asset.symbol}
                                  className="mb-1 block rounded-full border bg-white bg-center bg-no-repeat bg-contain"
                                  role="img"
                                  style={{
                                    width: icon,
                                    height: icon,
                                    borderColor: "rgba(56, 52, 47, 0.18)",
                                    backgroundImage: `url(${logoUrl})`,
                                  }}
                                />
                              ) : fallbackGlyph ? (
                                <span
                                  className="mb-1 inline-flex items-center justify-center rounded-full border"
                                  style={{
                                    width: icon,
                                    height: icon,
                                    borderColor: "rgba(56, 52, 47, 0.18)",
                                    backgroundColor: "#ffffff",
                                    fontSize: Math.max(12, icon * 0.58),
                                    lineHeight: 1,
                                  }}
                                >
                                  {fallbackGlyph === "cash" ? (
                                    <WalletMinimal
                                      className="size-[70%] text-foreground/80"
                                      aria-hidden
                                    />
                                  ) : (
                                    fallbackGlyph
                                  )}
                                </span>
                              ) : null
                            ) : null}
                            <div
                              className="font-semibold leading-none tracking-tight"
                              style={{
                                fontSize: ticker,
                                lineHeight: 1.03,
                                maxWidth: "100%",
                              }}
                            >
                              {truncateLabel(assetData.asset.label.toUpperCase(), leaf.width)}
                            </div>
                            {showChange ? (
                              <div
                                className="font-medium leading-none"
                                style={{
                                  marginTop: 4,
                                  fontSize: change,
                                  lineHeight: 1.06,
                                }}
                              >
                                {assetData.dayChangeLabel}
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="max-w-[260px]">
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold">{assetData.asset.label}</div>
                      <div>Ticker: {assetData.asset.symbol}</div>
                      <div>Udział: {assetData.shareLabel}</div>
                      <div>Wartość: {assetData.valueLabel}</div>
                      <div>Zmiana 1D: {assetData.dayChangeLabel}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
      <div className="text-center">
        <div className="text-[12px] font-medium text-muted-foreground">Wartość portfela</div>
        <div className="mt-1 inline-flex items-baseline gap-1 font-mono text-lg font-semibold tabular-nums text-foreground">
          <span>{totalAmountLabel}</span>
          {totalCurrencyLabel ? (
            <span className="text-[11px] font-medium text-muted-foreground/75">{totalCurrencyLabel}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
