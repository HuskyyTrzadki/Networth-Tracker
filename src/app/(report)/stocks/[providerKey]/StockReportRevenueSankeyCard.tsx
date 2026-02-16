"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import {
  buildRevenueSankeyModel,
  type CostSlice,
  type RevenueSegment,
} from "./stock-report-revenue-sankey-helpers";
import StockReportInfoHint from "./StockReportInfoHint";

type Props = Readonly<{
  revenueSegments: readonly RevenueSegment[];
  costSlices: readonly CostSlice[];
  netMarginPercent: number;
  netProfitDescription?: string;
}>;

type SankeyNodePattern = "solid" | "hatch" | "dots" | "cross";

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

type SankeyLineType = "solid" | "dashed" | "dotted";

const toLinkStyleType = (
  style: "solid" | "dashed" | "dotted"
): SankeyLineType => {
  if (style === "dashed") return "dashed";
  if (style === "dotted") return "dotted";
  return "solid";
};

const toDecal = (pattern: SankeyNodePattern) => {
  if (pattern === "hatch") {
    return { symbol: "rect", dashArrayX: [2, 2], dashArrayY: [6, 0], rotation: -0.7 };
  }
  if (pattern === "dots") {
    return { symbol: "circle", dashArrayX: [1, 3], dashArrayY: [2, 2] };
  }
  if (pattern === "cross") {
    return { symbol: "rect", dashArrayX: [2, 2], dashArrayY: [2, 2] };
  }
  return undefined;
};

const buildOption = (
  model: ReturnType<typeof buildRevenueSankeyModel>
): EChartsOption => {
  const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
  const nodes = model.nodes.map((node) => ({
    name: node.id,
    value: node.valuePercent,
    itemStyle: {
      color: node.color,
      borderColor: "#6b645a",
      borderWidth: 1,
      borderType: "dashed" as const,
      decal: toDecal(node.pattern),
    },
    label: {
      color: "#3b3b3b",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      position: node.lane === "right" ? "left" : "right",
      align: node.lane === "right" ? "right" : "left",
      distance: node.lane === "right" ? 12 : 8,
      width: node.lane === "right" ? 240 : 168,
      overflow: "truncate" as const,
      formatter: `${node.label} ${percentFormatter.format(node.valuePercent)}%`,
    },
  }));
  const links: Array<{
    source: string;
    target: string;
    value: number;
    lineStyle: {
      type: SankeyLineType;
      opacity: number;
      curveness: number;
    };
  }> = model.links.map((link) => ({
    source: link.sourceId,
    target: link.targetId,
    value: Number(link.valuePercent.toFixed(3)),
    lineStyle: {
      type: toLinkStyleType(link.style),
      opacity: link.targetId === "net-profit" ? 0.48 : 0.25,
      curveness: 0.5,
    },
  }));

  return {
    animationDuration: 260,
    animationDurationUpdate: 220,
    tooltip: {
      trigger: "item",
      backgroundColor: "#f8f2e5",
      borderColor: "#6b645a",
      borderWidth: 1,
      textStyle: {
        color: "#393939",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
      },
      formatter: (params: {
        dataType?: string;
        data?: { source?: string; target?: string; value?: number };
        name?: string;
        value?: number;
      }) => {
        if (params.dataType === "edge") {
          const source = params.data?.source ?? "-";
          const target = params.data?.target ?? "-";
          const value = params.data?.value ?? 0;
          const sourceLabel = nodeById.get(source)?.label ?? source;
          const targetLabel = nodeById.get(target)?.label ?? target;
          const targetDescription = nodeById.get(target)?.description;
          const description = targetDescription
            ? `<br/><span style="color:#6b645a;">ⓘ ${targetDescription}</span>`
            : "";

          return `${sourceLabel} -> ${targetLabel}<br/>${percentFormatter.format(value)}%${description}`;
        }

        const node = nodeById.get(params.name ?? "");
        const label = node?.label ?? params.name ?? "-";
        const value = typeof params.value === "number" ? params.value : 0;
        const description = node?.description
          ? `<br/><span style="color:#6b645a;">ⓘ ${node.description}</span>`
          : "";

        return `${label}<br/>${percentFormatter.format(value)}%${description}`;
      },
    } as EChartsOption["tooltip"],
    series: [
      {
        type: "sankey",
        left: 28,
        right: 34,
        top: 16,
        bottom: 16,
        draggable: false,
        nodeAlign: "justify",
        nodeGap: 9,
        nodeWidth: 22,
        layoutIterations: 36,
        emphasis: {
          focus: "adjacency",
          lineStyle: {
            opacity: 0.74,
            width: 1.35,
          },
        },
        blur: {
          lineStyle: {
            opacity: 0.09,
          },
        },
        levels: [
          { depth: 0, lineStyle: { color: "source", opacity: 0.2 } },
          { depth: 1, lineStyle: { color: "source", opacity: 0.2 } },
          { depth: 2, lineStyle: { color: "source", opacity: 0.45 } },
        ],
        lineStyle: {
          color: "source",
          curveness: 0.5,
          opacity: 0.3,
        },
        data: nodes,
        links,
      },
    ] as EChartsOption["series"],
  };
};

export function StockReportRevenueSankeyCard({
  revenueSegments,
  costSlices,
  netMarginPercent,
  netProfitDescription,
}: Props) {
  const model = buildRevenueSankeyModel({
    revenueSegments,
    costs: costSlices,
    netMarginPercent,
    netProfitDescription,
  });
  const option = buildOption(model);

  return (
    <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-1">
            <h4 className="text-base font-semibold tracking-tight">
              Przeplyw przychodow: suma -&gt; regiony -&gt; koszty i zysk
            </h4>
            <StockReportInfoHint
              text="Wykres czytamy od lewej: najpierw caly przychod, potem podzial geograficzny, na koncu pozycje kosztowe i zysk netto."
              ariaLabel="Wyjasnienie wykresu przeplywu przychodow"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Grubosc strumienia pokazuje, jaka czesc przychodu trafia do kosztow i jaka zostaje jako zysk.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Koszty: {percentFormatter.format(model.costTotalPercent)}% • Zysk:{" "}
          {percentFormatter.format(model.netMarginPercent)}%
        </p>
      </div>

      <div className="mt-3 h-[320px] overflow-hidden rounded-sm border border-dashed border-[color:var(--report-rule)] bg-card/35 p-2">
        <ReactECharts
          option={option}
          notMerge
          lazyUpdate
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>
    </article>
  );
}
