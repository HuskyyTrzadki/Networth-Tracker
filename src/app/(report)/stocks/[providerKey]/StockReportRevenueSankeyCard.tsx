"use client";

import {
  sankey as createSankey,
  sankeyJustify,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyLinkLayout,
  type SankeyNodeLayout,
} from "d3-sankey";

import {
  buildRevenueSankeyModel,
  type CostSlice,
  type RevenueSegment,
  type SankeyLink,
  type SankeyNode,
} from "./stock-report-revenue-sankey-helpers";
import StockReportInfoHint from "./StockReportInfoHint";

type Props = Readonly<{
  revenueSegments: readonly RevenueSegment[];
  costSlices: readonly CostSlice[];
  netMarginPercent: number;
  netProfitDescription?: string;
}>;

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});
const NET_PROFIT_COLOR = "#4f7a63";
const CHART_WIDTH = 960;
const CHART_HEIGHT = 336;
const CHART_MARGIN = {
  top: 18,
  right: 30,
  bottom: 18,
  left: 26,
} as const;

type SankeyChartNode = SankeyNode;
type SankeyChartLink = Readonly<
  SankeyLink & {
    source: string;
    target: string;
    value: number;
  }
>;

const sanitizeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

const getNodePatternId = (nodeId: string) => `sankey-node-pattern-${sanitizeId(nodeId)}`;

const getLinkDasharray = (style: SankeyLink["style"]) => {
  if (style === "dashed") return "5 4";
  if (style === "dotted") return "2 4";
  return undefined;
};

const getLinkColor = (
  link: SankeyLinkLayout<SankeyChartNode, SankeyChartLink>
) => {
  if (link.target.stage === "profit") {
    return NET_PROFIT_COLOR;
  }
  if (link.source.stage === "source") {
    return link.source.color;
  }
  return link.target.color;
};

const getLinkOpacity = (
  link: SankeyLinkLayout<SankeyChartNode, SankeyChartLink>
) => {
  if (link.target.stage === "profit") return 0.58;
  if (link.source.stage === "source") return 0.38;
  return 0.33;
};

const formatNodeLabel = (node: SankeyNodeLayout<SankeyChartNode>) =>
  `${node.label} ${percentFormatter.format(node.valuePercent)}%`;

const buildSankeyGraph = (
  model: ReturnType<typeof buildRevenueSankeyModel>
): SankeyGraph<SankeyChartNode, SankeyChartLink> => {
  const layout = createSankey<SankeyChartNode, SankeyChartLink>()
    .nodeId((node) => node.id)
    .nodeAlign(sankeyJustify)
    .nodeWidth(24)
    .nodePadding(16)
    .iterations(32)
    .extent([
      [CHART_MARGIN.left, CHART_MARGIN.top],
      [CHART_WIDTH - CHART_MARGIN.right, CHART_HEIGHT - CHART_MARGIN.bottom],
    ]);

  return layout({
    nodes: model.nodes.map((node) => ({ ...node })),
    links: model.links.map((link) => ({
      ...link,
      source: link.sourceId,
      target: link.targetId,
      value: Math.max(link.valuePercent, 0.001),
    })),
  });
};

const getNodeTextPosition = (node: SankeyNodeLayout<SankeyChartNode>) => {
  if (node.stage === "collector") {
    return {
      x: (node.x0 + node.x1) / 2,
      y: node.y0 - 8,
      anchor: "middle" as const,
    };
  }

  if (node.stage === "source") {
    return {
      x: node.x1 + 8,
      y: (node.y0 + node.y1) / 2,
      anchor: "start" as const,
    };
  }

  return {
    x: node.x0 - 8,
    y: (node.y0 + node.y1) / 2,
    anchor: "end" as const,
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
  const graph = buildSankeyGraph(model);
  const createPath = sankeyLinkHorizontal<SankeyChartNode, SankeyChartLink>();

  return (
    <article className="border-t border-dashed border-black/15 pt-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-1">
            <h4 className="text-base font-semibold tracking-tight">
              Przeplyw przychodow: zrodla -&gt; suma -&gt; koszty -&gt; zysk
            </h4>
            <StockReportInfoHint
              text="Wykres czytamy od lewej: segmenty przychodow wpadaja do jednego kolektora, po prawej koszty sa ulozone jak wodospad (COGS, OPEX, Podatki), a na samym dole zostaje zysk netto."
              ariaLabel="Wyjasnienie wykresu przeplywu przychodow"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Grubosc strumienia pokazuje, jaka czesc przychodu zostaje zjedzona przez koszty i jaka trafia finalnie do zysku netto.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Koszty: {percentFormatter.format(model.costTotalPercent)}% • Zysk:{" "}
          {percentFormatter.format(model.netMarginPercent)}%
        </p>
      </div>

      <div className="mt-3 h-[336px] overflow-hidden bg-white/70 p-2">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-full w-full"
          aria-label="Wykres przeplywu przychodow Sankey"
          role="img"
        >
          <defs>
            {graph.nodes.map((node) => {
              if (node.pattern === "solid") {
                return null;
              }

              const patternId = getNodePatternId(node.id);

              if (node.pattern === "hatch") {
                return (
                  <pattern
                    key={patternId}
                    id={patternId}
                    patternUnits="userSpaceOnUse"
                    width={8}
                    height={8}
                  >
                    <rect width={8} height={8} fill={node.color} />
                    <path d="M0 8 L8 0" stroke="#6b645a" strokeWidth={1} />
                  </pattern>
                );
              }

              if (node.pattern === "dots") {
                return (
                  <pattern
                    key={patternId}
                    id={patternId}
                    patternUnits="userSpaceOnUse"
                    width={8}
                    height={8}
                  >
                    <rect width={8} height={8} fill={node.color} />
                    <circle cx={2} cy={2} r={1.1} fill="#6b645a" />
                    <circle cx={6} cy={6} r={1.1} fill="#6b645a" />
                  </pattern>
                );
              }

              return (
                <pattern
                  key={patternId}
                  id={patternId}
                  patternUnits="userSpaceOnUse"
                  width={8}
                  height={8}
                >
                  <rect width={8} height={8} fill={node.color} />
                  <path d="M0 0 L8 8 M8 0 L0 8" stroke="#6b645a" strokeWidth={1} />
                </pattern>
              );
            })}
          </defs>

          <g fill="none">
            {graph.links.map((link) => {
              const path = createPath(link);
              const sourceLabel = link.source.label;
              const targetLabel = link.target.label;
              const description = link.target.description;

              return (
                <path
                  key={link.id}
                  d={path}
                  stroke={getLinkColor(link)}
                  strokeOpacity={getLinkOpacity(link)}
                  strokeWidth={Math.max(1, link.width)}
                  strokeDasharray={getLinkDasharray(link.style)}
                >
                  <title>{`${sourceLabel} -> ${targetLabel}: ${percentFormatter.format(link.valuePercent)}%${description ? ` | ${description}` : ""}`}</title>
                </path>
              );
            })}
          </g>

          <g>
            {graph.nodes.map((node) => {
              const patternId = getNodePatternId(node.id);
              const textPosition = getNodeTextPosition(node);
              const fill =
                node.pattern === "solid"
                  ? node.color
                  : `url(#${patternId})`;

              return (
                <g key={node.id}>
                  <rect
                    x={node.x0}
                    y={node.y0}
                    width={Math.max(1, node.x1 - node.x0)}
                    height={Math.max(1, node.y1 - node.y0)}
                    fill={fill}
                    stroke="#6b645a"
                    strokeWidth={1}
                    rx={2}
                    ry={2}
                  >
                    <title>{`${node.label}: ${percentFormatter.format(node.valuePercent)}%${node.description ? ` | ${node.description}` : ""}`}</title>
                  </rect>
                  <text
                    x={textPosition.x}
                    y={textPosition.y}
                    textAnchor={textPosition.anchor}
                    dominantBaseline={node.stage === "collector" ? "auto" : "middle"}
                    fill="#2f2c27"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {formatNodeLabel(node)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </article>
  );
}
