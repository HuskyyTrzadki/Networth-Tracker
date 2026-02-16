export type RevenueSegment = Readonly<{
  id: string;
  label: string;
  valuePercent: number;
  color: string;
}>;

export type CostSlice = Readonly<{
  id: string;
  label: string;
  valuePercent: number;
}>;

export type SankeyNode = Readonly<{
  id: string;
  label: string;
  lane: "left" | "middle" | "right";
  valuePercent: number;
  color: string;
  pattern: "solid" | "hatch" | "dots" | "cross";
}>;

export type SankeyLink = Readonly<{
  id: string;
  sourceId: string;
  targetId: string;
  valuePercent: number;
  style: "solid" | "dashed" | "dotted";
}>;

export type SankeyModel = Readonly<{
  nodes: readonly SankeyNode[];
  links: readonly SankeyLink[];
  netMarginPercent: number;
  costTotalPercent: number;
}>;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const normalizeSlices = <T extends { valuePercent: number }>(
  slices: readonly T[]
) => {
  const total = slices.reduce((sum, slice) => sum + slice.valuePercent, 0);
  if (total <= 0 || !Number.isFinite(total)) {
    return slices.map((slice) => ({ ...slice, valuePercent: 0 }));
  }

  return slices.map((slice) => ({
    ...slice,
    valuePercent: (slice.valuePercent / total) * 100,
  }));
};

export const buildRevenueSankeyModel = (params: Readonly<{
  revenueSegments: readonly RevenueSegment[];
  costs: readonly CostSlice[];
  netMarginPercent: number;
}>): SankeyModel => {
  const costPalette = ["#7a7368", "#827a70", "#8a8177", "#746d64"] as const;
  const segments = normalizeSlices(
    params.revenueSegments.filter(
      (segment) =>
        Number.isFinite(segment.valuePercent) && segment.valuePercent > 0
    )
  );
  const costSlices = normalizeSlices(
    params.costs.filter(
      (cost) => Number.isFinite(cost.valuePercent) && cost.valuePercent > 0
    )
  );
  const netMarginPercent = clampPercent(params.netMarginPercent);
  const costTotalPercent = clampPercent(100 - netMarginPercent);

  const nodes: SankeyNode[] = [
    ...segments.map((segment) => ({
      id: segment.id,
      label: segment.label,
      lane: "left" as const,
      valuePercent: segment.valuePercent,
      color: segment.color,
      pattern: "solid" as const,
    })),
    ...costSlices.map((cost, index) => ({
      id: cost.id,
      label: cost.label,
      lane: "middle" as const,
      valuePercent: (cost.valuePercent / 100) * costTotalPercent,
      color: costPalette[index % costPalette.length],
      pattern:
        index % 3 === 0
          ? ("hatch" as const)
          : index % 3 === 1
            ? ("dots" as const)
            : ("cross" as const),
    })),
    {
      id: "net-profit",
      label: "Zysk netto",
      lane: "right" as const,
      valuePercent: netMarginPercent,
      color: "#4d4a45",
      pattern: "solid" as const,
    },
  ];

  const links: SankeyLink[] = [];

  segments.forEach((segment) => {
    costSlices.forEach((cost, index) => {
      const targetNode = nodes.find((node) => node.id === cost.id);
      const shareOfCosts = (cost.valuePercent / 100) * costTotalPercent;
      const linkValue = (segment.valuePercent * shareOfCosts) / 100;
      if (!targetNode || linkValue <= 0) return;

      links.push({
        id: `${segment.id}-${cost.id}`,
        sourceId: segment.id,
        targetId: cost.id,
        valuePercent: linkValue,
        style: index % 2 === 0 ? "dashed" : "dotted",
      });
    });

    const netLinkValue = (segment.valuePercent * netMarginPercent) / 100;
    if (netLinkValue <= 0) return;
    links.push({
      id: `${segment.id}-net-profit`,
      sourceId: segment.id,
      targetId: "net-profit",
      valuePercent: netLinkValue,
      style: "solid",
    });
  });

  return {
    nodes,
    links,
    netMarginPercent,
    costTotalPercent,
  };
};
