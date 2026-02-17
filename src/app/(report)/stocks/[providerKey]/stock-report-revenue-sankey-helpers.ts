export type RevenueSegment = Readonly<{
  id: string;
  label: string;
  valuePercent: number;
  color: string;
  description?: string;
}>;

export type CostSlice = Readonly<{
  id: string;
  label: string;
  valuePercent: number;
  description?: string;
}>;

export type SankeyNode = Readonly<{
  id: string;
  label: string;
  stage: "source" | "collector" | "cost" | "profit";
  depth: number;
  valuePercent: number;
  color: string;
  pattern: "solid" | "hatch" | "dots" | "cross";
  description?: string;
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
  netProfitDescription?: string;
}>): SankeyModel => {
  const costPalette = ["#7b756d", "#8a8379", "#9a8b78", "#746d64"] as const;
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
      stage: "source" as const,
      depth: 0,
      valuePercent: segment.valuePercent,
      color: segment.color,
      pattern: "solid" as const,
      description: segment.description,
    })),
    {
      id: "total-revenue",
      label: "Przychody razem",
      stage: "collector" as const,
      depth: 1,
      valuePercent: 100,
      color: "#655f57",
      pattern: "solid" as const,
      description:
        "Wspolny worek gotowki: caly strumien przychodow (100%) przed podzialem na koszty i zysk.",
    },
    ...costSlices.map((cost, index) => ({
      id: cost.id,
      label: cost.label,
      stage: "cost" as const,
      depth: 2,
      valuePercent: (cost.valuePercent / 100) * costTotalPercent,
      color: costPalette[index % costPalette.length],
      pattern:
        index % 3 === 0
          ? ("hatch" as const)
          : index % 3 === 1
            ? ("dots" as const)
            : ("cross" as const),
      description: cost.description,
    })),
    {
      id: "net-profit",
      label: "Zysk netto",
      stage: "profit" as const,
      depth: 2,
      valuePercent: netMarginPercent,
      color: "#5bb58a",
      pattern: "solid" as const,
      description:
        params.netProfitDescription ??
        "Czesc przychodu, ktora pozostaje po pokryciu kosztow i podatkow.",
    },
  ];

  const links: SankeyLink[] = [];

  segments.forEach((segment) => {
    links.push({
      id: `${segment.id}-total-revenue`,
      sourceId: segment.id,
      targetId: "total-revenue",
      valuePercent: segment.valuePercent,
      style: "solid",
    });
  });

  costSlices.forEach((cost, index) => {
    const targetNode = nodes.find((node) => node.id === cost.id);
    const linkValue = (cost.valuePercent / 100) * costTotalPercent;
    if (!targetNode || linkValue <= 0) return;

    links.push({
      id: `total-revenue-${cost.id}`,
      sourceId: "total-revenue",
      targetId: cost.id,
      valuePercent: linkValue,
      style: index % 2 === 0 ? "dashed" : "dotted",
    });
  });

  if (netMarginPercent > 0) {
    links.push({
      id: "total-revenue-net-profit",
      sourceId: "total-revenue",
      targetId: "net-profit",
      valuePercent: netMarginPercent,
      style: "solid",
    });
  }

  return {
    nodes,
    links,
    netMarginPercent,
    costTotalPercent,
  };
};
