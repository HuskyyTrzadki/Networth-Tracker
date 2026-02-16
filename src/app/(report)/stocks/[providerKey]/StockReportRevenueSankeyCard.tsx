"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import {
  buildRevenueSankeyModel,
  type CostSlice,
  type RevenueSegment,
} from "./stock-report-revenue-sankey-helpers";

type Props = Readonly<{
  revenueSegments: readonly RevenueSegment[];
  costSlices: readonly CostSlice[];
  netMarginPercent: number;
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
          return `${sourceLabel} -> ${targetLabel}<br/>${percentFormatter.format(value)}%`;
        }

        const label = nodeById.get(params.name ?? "")?.label ?? params.name ?? "-";
        const value = typeof params.value === "number" ? params.value : 0;
        return `${label}<br/>${percentFormatter.format(value)}%`;
      },
    } as EChartsOption["tooltip"],
    series: [
      {
        type: "sankey",
        left: 18,
        right: 18,
        top: 16,
        bottom: 16,
        draggable: false,
        nodeAlign: "justify",
        nodeGap: 9,
        nodeWidth: 22,
        layoutIterations: 36,
        emphasis: {
          focus: "adjacency",
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
}: Props) {
  const model = buildRevenueSankeyModel({
    revenueSegments,
    costs: costSlices,
    netMarginPercent,
  });
  const option = buildOption(model);

  return (
    <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="text-base font-semibold tracking-tight">
            Przeplyw od przychodu do zysku (diagram sankey)
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Grubosc strumienia pokazuje, ile przychodu znika po drodze przez koszty.
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
