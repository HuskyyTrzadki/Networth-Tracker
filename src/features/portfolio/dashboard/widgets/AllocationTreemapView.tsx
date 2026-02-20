"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import {
  formatCurrencyString,
  getCurrencyFormatter,
} from "@/lib/format-currency";

import type { CurrencyCode } from "@/features/market-data";

import type { AllocationCategoryRow } from "./allocation-view-model";

type Props = Readonly<{
  categories: readonly AllocationCategoryRow[];
  baseCurrency: CurrencyCode;
  totalAmountLabel: string;
  totalCurrencyLabel: string | null;
}>;

type TreemapNode = Readonly<{
  name: string;
  value?: number;
  share: number;
  shareLabel: string;
  valueLabel: string;
  dayChangePercent: number | null;
  dayChangeLabel: string;
  labelMode: "NONE" | "NAME" | "NAME_SHARE" | "FULL";
  labelScale: "SM" | "MD" | "LG";
  leafTone: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  isLeaf: boolean;
  itemStyle?: Readonly<{
    color: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
  children?: readonly TreemapNode[];
}>;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

const toNumberValue = (value: string) => {
  const compact = value.replace(/\s+/g, "").trim();
  const normalized =
    compact.includes(",") && !compact.includes(".")
      ? compact.replace(",", ".")
      : compact.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const formatSignedPercent = (value: number | null) => {
  if (value === null || Math.abs(value) < 0.0001) {
    return "0,00%";
  }

  const absolute = new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return value > 0 ? `+${absolute}` : `-${absolute}`;
};

const formatDirectionalChange = (value: number | null) => {
  const arrow =
    value === null || Math.abs(value) < 0.0001 ? "→" : value > 0 ? "↑" : "↓";
  return `${arrow} ${formatSignedPercent(value)}`;
};

const resolveLabelMode = (share: number): TreemapNode["labelMode"] => {
  if (share >= 0.055) return "FULL";
  if (share >= 0.02) return "NAME_SHARE";
  if (share >= 0.01) return "NAME";
  return "NONE";
};

const formatLeafLabel = (data: TreemapNode) => {
  if (data.labelMode === "NONE") return "";
  const toneSuffix =
    data.leafTone === "POSITIVE"
      ? "Pos"
      : data.leafTone === "NEGATIVE"
        ? "Neg"
        : "Neutral";
  const tickerToken = `{ticker${data.labelScale}${toneSuffix}|${data.name.toUpperCase()}}`;

  if (data.labelMode === "NAME") return tickerToken;
  if (data.labelMode === "NAME_SHARE") {
    return `${tickerToken}\n{share${toneSuffix}|${data.shareLabel}}`;
  }
  return `${tickerToken}\n{share${toneSuffix}|${data.shareLabel}}\n{change${toneSuffix}|${data.dayChangeLabel}}`;
};

const pageBackgroundBeige = "#f6f2ec";
const categoryHeaderTint = pageBackgroundBeige;

const positiveLeafFill = "#dcfce7";
const positiveLeafInk = "#052e16";
const positiveLeafInkMuted = "rgba(5, 46, 22, 0.7)";
const negativeLeafFill = "#ffe4e6";
const negativeLeafInk = "#4c0519";
const negativeLeafInkMuted = "rgba(76, 5, 25, 0.7)";
const neutralLeafFill = "#ffffff";
const neutralLeafInk = "#111827";
const neutralLeafInkMuted = "rgba(17, 24, 39, 0.7)";
const treemapGap = 4;

const toNodeValue = (valueBase: string, share: number) => {
  const parsed = toNumberValue(valueBase);
  if (parsed > 0) return parsed;
  if (share > 0) return share * 1_000_000;
  return 0;
};

const resolveLeafTone = (
  dayChangePercent: number | null
): TreemapNode["leafTone"] => {
  if (dayChangePercent === null || Math.abs(dayChangePercent) < 0.0001) {
    return "NEUTRAL";
  }

  return dayChangePercent > 0 ? "POSITIVE" : "NEGATIVE";
};

const resolveLabelScale = (share: number): TreemapNode["labelScale"] => {
  if (share >= 0.18) return "LG";
  if (share >= 0.06) return "MD";
  return "SM";
};

const resolveLeafFill = (tone: TreemapNode["leafTone"]) => {
  if (tone === "POSITIVE") return positiveLeafFill;
  if (tone === "NEGATIVE") return negativeLeafFill;
  return neutralLeafFill;
};

const buildOption = (nodes: readonly TreemapNode[]) => ({
  animationDuration: 260,
  animationDurationUpdate: 220,
  tooltip: {
    trigger: "item",
    backgroundColor: "#faf7f2",
    borderColor: "#d8d1c8",
    borderWidth: 1,
    textStyle: {
      color: "#2f2f2f",
      fontSize: 11,
      fontFamily: "var(--font-mono)",
    },
    formatter: (params: unknown) => {
      const data = (params as { data?: Partial<TreemapNode> | null }).data;
      if (!data || typeof data.name !== "string") return "";

      const shareLabel =
        typeof data.shareLabel === "string"
          ? data.shareLabel
          : typeof data.share === "number"
            ? formatPercent(data.share)
            : "—";
      const valueLabel = typeof data.valueLabel === "string" ? data.valueLabel : "—";

      if (data.isLeaf === true) {
        const dayChangeLabel =
          typeof data.dayChangeLabel === "string" ? data.dayChangeLabel : "0,00%";
        return `${data.name}<br/>${shareLabel} • ${valueLabel}<br/>Dzisiaj: ${dayChangeLabel}`;
      }

      return `${data.name}<br/>${shareLabel} • ${valueLabel}`;
    },
  },
  series: [
    {
      type: "treemap",
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      visibleMin: 1,
      leafDepth: 2,
      upperLabel: {
        show: false,
        height: 0,
      },
      label: {
        show: true,
        formatter: (params: unknown) => {
          const data = (params as { data?: TreemapNode | null }).data;
          if (!data || !data.isLeaf) return "";
          return formatLeafLabel(data);
        },
        position: "inside",
        align: "center",
        verticalAlign: "middle",
        padding: 0,
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        lineHeight: 20,
        overflow: "truncate",
        rich: {
          tickerLGPos: {
            color: positiveLeafInk,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 32,
            fontFamily: "var(--font-mono)",
          },
          tickerMDPos: {
            color: positiveLeafInk,
            fontSize: 23,
            fontWeight: 700,
            lineHeight: 27,
            fontFamily: "var(--font-mono)",
          },
          tickerSMPos: {
            color: positiveLeafInk,
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 22,
            fontFamily: "var(--font-mono)",
          },
          sharePos: {
            color: positiveLeafInkMuted,
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 21,
            fontFamily: "var(--font-mono)",
          },
          changePos: {
            color: positiveLeafInk,
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 21,
            fontFamily: "var(--font-mono)",
          },
          tickerLGNeg: {
            color: negativeLeafInk,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 32,
            fontFamily: "var(--font-mono)",
          },
          tickerMDNeg: {
            color: negativeLeafInk,
            fontSize: 23,
            fontWeight: 700,
            lineHeight: 27,
            fontFamily: "var(--font-mono)",
          },
          tickerSMNeg: {
            color: negativeLeafInk,
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 22,
            fontFamily: "var(--font-mono)",
          },
          shareNeg: {
            color: negativeLeafInkMuted,
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 21,
            fontFamily: "var(--font-mono)",
          },
          changeNeg: {
            color: negativeLeafInk,
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 21,
            fontFamily: "var(--font-mono)",
          },
          tickerLGNeutral: {
            color: neutralLeafInk,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 32,
            fontFamily: "var(--font-mono)",
          },
          tickerMDNeutral: {
            color: neutralLeafInk,
            fontSize: 23,
            fontWeight: 700,
            lineHeight: 27,
            fontFamily: "var(--font-mono)",
          },
          tickerSMNeutral: {
            color: neutralLeafInk,
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 22,
            fontFamily: "var(--font-mono)",
          },
          shareNeutral: {
            color: neutralLeafInkMuted,
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 21,
            fontFamily: "var(--font-mono)",
          },
          changeNeutral: {
            color: neutralLeafInk,
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 21,
            fontFamily: "var(--font-mono)",
          },
        },
      },
      itemStyle: {
        borderColor: pageBackgroundBeige,
        borderWidth: treemapGap,
        gapWidth: treemapGap,
      },
      levels: [
        {
          itemStyle: {
            borderColor: pageBackgroundBeige,
            borderWidth: 1,
            gapWidth: treemapGap,
            color: categoryHeaderTint,
          },
          upperLabel: {
            show: false,
            height: 0,
          },
        },
        {
          upperLabel: {
            show: false,
            height: 0,
          },
          itemStyle: {
            borderColor: pageBackgroundBeige,
            gapWidth: treemapGap,
            borderWidth: 1,
          },
        },
        {
          itemStyle: {
            borderColor: pageBackgroundBeige,
            gapWidth: treemapGap,
            borderWidth: 1,
          },
        },
      ],
      data: nodes.map((node) => ({
        ...node,
        children: node.children ? [...node.children] : undefined,
      })),
    },
  ],
});

export function AllocationTreemapView({
  categories,
  baseCurrency,
  totalAmountLabel,
  totalCurrencyLabel,
}: Props) {
  const formatter = getCurrencyFormatter(baseCurrency);
  const nodes: TreemapNode[] = categories.map((category) => ({
    name: category.label,
    value: undefined,
    share: category.share,
    shareLabel: formatPercent(category.share),
    valueLabel:
      formatter && category.valueBase
        ? formatCurrencyString(category.valueBase, formatter) ??
          `${category.valueBase} ${baseCurrency}`
        : `${category.valueBase} ${baseCurrency}`,
    dayChangePercent: null,
    dayChangeLabel: "→ 0,00%",
    labelMode: "NONE",
    labelScale: "SM",
    leafTone: "NEUTRAL",
    isLeaf: false,
    itemStyle: {
      color: categoryHeaderTint,
      borderColor: pageBackgroundBeige,
      borderWidth: 1,
    },
    children: category.assets.map((asset) => {
      const leafTone = resolveLeafTone(asset.todayChangePercent);

      return {
        name: asset.label,
        value: toNodeValue(asset.valueBase, asset.share),
        share: asset.share,
        shareLabel: formatPercent(asset.share),
        valueLabel:
          formatter && asset.valueBase
            ? formatCurrencyString(asset.valueBase, formatter) ??
              `${asset.valueBase} ${baseCurrency}`
            : `${asset.valueBase} ${baseCurrency}`,
        dayChangePercent: asset.todayChangePercent,
        dayChangeLabel: formatDirectionalChange(asset.todayChangePercent),
        labelMode: resolveLabelMode(asset.share),
        labelScale: resolveLabelScale(asset.share),
        leafTone,
        isLeaf: true,
        itemStyle: {
          color: resolveLeafFill(leafTone),
          borderColor: pageBackgroundBeige,
          borderWidth: 1,
        },
      };
    }),
  }));
  const chartNodes =
    nodes.length === 1 && (nodes[0]?.children?.length ?? 0) > 0
      ? [...(nodes[0]?.children ?? [])]
      : nodes;
  const option = buildOption(chartNodes);
  const chartEvents = {
    finished: () => {
      if (process.env.NODE_ENV !== "production") {
        console.info("[AllocationTreemapView] finished", {
          categories: chartNodes.filter((node) => !node.isLeaf).length,
          leaves: chartNodes.filter((node) => node.isLeaf).length,
        });
      }
    },
  };

  if (nodes.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground">
        Brak danych do alokacji
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60 p-1"
        style={{ backgroundColor: pageBackgroundBeige }}
      >
        <ReactECharts
          option={option as EChartsOption}
          notMerge
          lazyUpdate
          onEvents={chartEvents}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>
      <div className="text-center">
        <div className="text-[12px] font-medium text-muted-foreground">
          Wartość portfela
        </div>
        <div className="mt-1 inline-flex items-baseline gap-1 font-mono text-lg font-semibold tabular-nums text-foreground">
          <span>{totalAmountLabel}</span>
          {totalCurrencyLabel ? (
            <span className="text-[11px] font-medium text-muted-foreground/75">
              {totalCurrencyLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
