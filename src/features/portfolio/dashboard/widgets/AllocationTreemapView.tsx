"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { buildLogoDevTickerProxyUrl } from "@/features/common/lib/logo-dev";

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
  id: string;
  name: string;
  value?: number;
  share: number;
  shareLabel: string;
  valueLabel: string;
  dayChangePercent: number | null;
  dayChangeLabel: string;
  labelMode: "NONE" | "NAME_CHANGE";
  labelScale: "XS" | "SM" | "MD" | "LG";
  leafTone: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  showIcon: boolean;
  iconRichKey?: string;
  iconImageUrl?: string;
  iconGlyph?: string;
  isLeaf: boolean;
  silent?: boolean;
  tooltip?: Readonly<{
    show?: boolean;
  }>;
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

const formatSignedPercent = (value: number | null, digits = 2) => {
  const absolute = new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value ?? 0));

  if (value === null || Math.abs(value) < 0.0001) {
    return absolute;
  }

  return value > 0 ? `+${absolute}` : `-${absolute}`;
};

const formatDirectionalChange = (value: number | null, digits = 2) => {
  const arrow =
    value === null || Math.abs(value) < 0.0001 ? "→" : value > 0 ? "↑" : "↓";
  return `${arrow} ${formatSignedPercent(value, digits)}`;
};

const resolveLabelMode = (share: number): TreemapNode["labelMode"] => {
  if (share >= 0.004) return "NAME_CHANGE";
  return "NONE";
};

const formatLeafLabel = (data: TreemapNode) => {
  if (data.labelMode === "NONE") return "";
  const scale = data.labelScale;
  const toneSuffix =
    data.leafTone === "POSITIVE"
      ? "Pos"
      : data.leafTone === "NEGATIVE"
        ? "Neg"
        : "Neutral";
  const iconToken =
    data.showIcon && data.iconRichKey
      ? `{${data.iconRichKey}|}`
      : data.showIcon && data.iconGlyph
        ? `{iconGlyph|${data.iconGlyph}}`
        : "";
  const tickerToken = `{ticker${scale}${toneSuffix}|${data.name.toUpperCase()}}`;
  const changeToken = `{change${scale}${toneSuffix}|${data.dayChangeLabel}}`;
  const iconLinePrefix = iconToken.length > 0 ? `${iconToken} ` : "";

  return `${iconLinePrefix}${tickerToken}\n${changeToken}`;
};

const pageBackgroundBeige = "var(--muted)";
const categoryHeaderTint = "var(--muted)";

const positiveLeafFill = "color-mix(in srgb, var(--profit) 16%, var(--card) 84%)";
const positiveLeafInk = "var(--foreground)";
const negativeLeafFill = "color-mix(in srgb, var(--loss) 16%, var(--card) 84%)";
const negativeLeafInk = "var(--foreground)";
const neutralLeafFill = "var(--card)";
const neutralLeafInk = "var(--foreground)";
const treemapBorderColor = "var(--background)";
const treemapGap = 2;
const treemapBorderWidth = 2;
const cashIconRichKey = "iconCash";
const cashIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2f2b27" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>';
const cashIconDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(cashIconSvg)}`;

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
  if (share >= 0.2) return "LG";
  if (share >= 0.08) return "MD";
  if (share >= 0.03) return "SM";
  return "XS";
};

const resolveLeafFill = (tone: TreemapNode["leafTone"]) => {
  if (tone === "POSITIVE") return positiveLeafFill;
  if (tone === "NEGATIVE") return negativeLeafFill;
  return neutralLeafFill;
};

const toIconRichKey = (value: string) =>
  `icon_${value.replace(/[^a-zA-Z0-9_]/g, "_")}`;

const collectLeafNodes = (nodes: readonly TreemapNode[]): TreemapNode[] =>
  nodes.flatMap((node) => {
    if (node.isLeaf) return [node];
    return node.children ? collectLeafNodes(node.children) : [];
  });

const buildIconRichStyles = (nodes: readonly TreemapNode[]) => {
  const iconStyles: Record<string, unknown> = {
    [cashIconRichKey]: {
      width: 14,
      height: 14,
      backgroundColor: { image: cashIconDataUrl },
    },
  };
  for (const leaf of collectLeafNodes(nodes)) {
    if (!leaf.showIcon || !leaf.iconRichKey || !leaf.iconImageUrl) continue;
    iconStyles[leaf.iconRichKey] = {
      width: 14,
      height: 14,
      backgroundColor: { image: leaf.iconImageUrl },
    };
  }
  return iconStyles;
};

const buildOption = (nodes: readonly TreemapNode[]) => ({
  animationDuration: 260,
  animationDurationUpdate: 220,
  tooltip: {
    trigger: "item",
    backgroundColor: "var(--popover)",
    borderColor: "var(--border)",
    borderWidth: 1,
    textStyle: {
      color: "var(--popover-foreground)",
      fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace",
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
        return `${data.name}<br/>${valueLabel}<br/>Udział w portfelu: ${shareLabel}<br/>Dzisiaj: ${dayChangeLabel}`;
      }

      return `${data.name}<br/>${shareLabel} • ${valueLabel}`;
    },
  },
  series: [
    {
      type: "treemap",
      roam: false,
      nodeClick: false,
      emphasis: {
        disabled: true,
      },
      blur: {
        disabled: true,
      },
      select: {
        disabled: true,
      },
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
        position: "insideTopLeft",
        align: "left",
        verticalAlign: "top",
        padding: [10, 10, 10, 10],
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 18,
        overflow: "truncate",
        rich: {
          tickerLGPos: {
            color: positiveLeafInk,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 32,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerMDPos: {
            color: positiveLeafInk,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 24,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerSMPos: {
            color: positiveLeafInk,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 18,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerXSPos: {
            color: positiveLeafInk,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeLGPos: {
            color: positiveLeafInk,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 20,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeMDPos: {
            color: positiveLeafInk,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 18,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeSMPos: {
            color: positiveLeafInk,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 16,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeXSPos: {
            color: positiveLeafInk,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerLGNeg: {
            color: negativeLeafInk,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 32,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerMDNeg: {
            color: negativeLeafInk,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 24,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerSMNeg: {
            color: negativeLeafInk,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 18,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerXSNeg: {
            color: negativeLeafInk,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeLGNeg: {
            color: negativeLeafInk,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 20,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeMDNeg: {
            color: negativeLeafInk,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 18,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeSMNeg: {
            color: negativeLeafInk,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 16,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeXSNeg: {
            color: negativeLeafInk,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerLGNeutral: {
            color: neutralLeafInk,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 32,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerMDNeutral: {
            color: neutralLeafInk,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 24,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerSMNeutral: {
            color: neutralLeafInk,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 18,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          tickerXSNeutral: {
            color: neutralLeafInk,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeLGNeutral: {
            color: neutralLeafInk,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 20,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeMDNeutral: {
            color: neutralLeafInk,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 18,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeSMNeutral: {
            color: neutralLeafInk,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 16,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          changeXSNeutral: {
            color: neutralLeafInk,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          iconGlyph: {
            color: "var(--foreground)",
            fontSize: 13,
            lineHeight: 14,
            fontFamily: "'IBM Plex Mono', monospace",
          },
          ...buildIconRichStyles(nodes),
        },
      },
      itemStyle: {
        borderColor: treemapBorderColor,
        borderWidth: treemapBorderWidth,
        gapWidth: treemapGap,
      },
      levels: [
        {
          itemStyle: {
            borderColor: treemapBorderColor,
            borderWidth: treemapBorderWidth,
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
            borderColor: treemapBorderColor,
            gapWidth: treemapGap,
            borderWidth: treemapBorderWidth,
          },
        },
        {
          itemStyle: {
            borderColor: treemapBorderColor,
            gapWidth: treemapGap,
            borderWidth: treemapBorderWidth,
          },
          label: {
            show: true,
            position: "insideTopLeft",
            align: "left",
            verticalAlign: "top",
            padding: [10, 10, 10, 10],
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
    id: category.id,
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
    showIcon: false,
    iconRichKey: undefined,
    iconImageUrl: undefined,
    iconGlyph: undefined,
    isLeaf: false,
    itemStyle: {
      color: categoryHeaderTint,
      borderColor: treemapBorderColor,
      borderWidth: treemapBorderWidth,
    },
    silent: true,
    tooltip: {
      show: false,
    },
    children: category.assets.map((asset) => {
      const leafTone = resolveLeafTone(asset.todayChangePercent);
      const labelMode = resolveLabelMode(asset.share);
      const labelScale = resolveLabelScale(asset.share);
      const changeDigits = labelScale === "XS" ? 1 : 2;
      const showIcon = labelMode === "NAME_CHANGE";
      const stockIconUrl =
        !asset.isCurrencyCash && asset.symbol !== "CUSTOM"
          ? (buildLogoDevTickerProxyUrl(asset.symbol) ?? undefined)
          : undefined;
      const customGlyph = asset.customAssetType ? asset.customGlyph : null;
      const iconRichKey = asset.isCurrencyCash
        ? cashIconRichKey
        : stockIconUrl
          ? toIconRichKey(asset.id)
          : undefined;

      return {
        id: asset.id,
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
        dayChangeLabel: formatDirectionalChange(asset.todayChangePercent, changeDigits),
        labelMode,
        labelScale,
        leafTone,
        showIcon,
        iconRichKey,
        iconImageUrl: stockIconUrl,
        iconGlyph: customGlyph ?? undefined,
        isLeaf: true,
        itemStyle: {
          color: resolveLeafFill(leafTone),
          borderColor: treemapBorderColor,
          borderWidth: treemapBorderWidth,
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
