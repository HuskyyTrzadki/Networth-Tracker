import { describe, expect, it } from "vitest";

import { buildRevenueSankeyModel } from "./stock-report-revenue-sankey-helpers";

describe("buildRevenueSankeyModel", () => {
  it("normalizes revenue segments and creates links to costs and net profit", () => {
    const model = buildRevenueSankeyModel({
      revenueSegments: [
        { id: "foa", label: "Rodzina aplikacji", valuePercent: 90, color: "#111" },
        { id: "rl", label: "Reality Labs", valuePercent: 10, color: "#222" },
      ],
      costs: [
        { id: "cogs", label: "COGS", valuePercent: 60 },
        { id: "rd", label: "R&D", valuePercent: 40 },
      ],
      netMarginPercent: 30,
    });

    const leftTotal = model.nodes
      .filter((node) => node.lane === "left")
      .reduce((sum, node) => sum + node.valuePercent, 0);
    const totalRevenueNode = model.nodes.find((node) => node.id === "total-revenue");
    const costTotal = model.nodes
      .filter((node) => node.lane === "right" && node.id !== "net-profit")
      .reduce((sum, node) => sum + node.valuePercent, 0);
    const netNode = model.nodes.find((node) => node.id === "net-profit");
    const segmentToCostLinks = model.links.filter((link) => {
      const sourceNode = model.nodes.find((node) => node.id === link.sourceId);
      const targetNode = model.nodes.find((node) => node.id === link.targetId);
      return sourceNode?.lane === "left" && targetNode?.lane === "right";
    });

    expect(leftTotal).toBeCloseTo(100, 5);
    expect(costTotal).toBeCloseTo(70, 5);
    expect(totalRevenueNode?.valuePercent).toBeCloseTo(100, 5);
    expect(netNode?.valuePercent).toBeCloseTo(30, 5);
    expect(model.links.length).toBe(5);
    expect(segmentToCostLinks.length).toBe(0);
  });

  it("clamps invalid net margin to 100 and keeps links valid", () => {
    const model = buildRevenueSankeyModel({
      revenueSegments: [
        { id: "single", label: "Segment", valuePercent: 100, color: "#111" },
      ],
      costs: [{ id: "cost", label: "Koszty", valuePercent: 100 }],
      netMarginPercent: 140,
    });

    expect(model.netMarginPercent).toBe(100);
    expect(model.costTotalPercent).toBe(0);
    expect(model.links.some((link) => link.targetId === "cost")).toBe(false);
    expect(model.links.find((link) => link.targetId === "net-profit")?.valuePercent).toBe(
      100
    );
    expect(
      model.links.find((link) => link.sourceId === "single" && link.targetId === "total-revenue")
        ?.valuePercent
    ).toBe(100);
    expect(
      model.links.find((link) => link.sourceId === "total-revenue" && link.targetId === "net-profit")
        ?.valuePercent
    ).toBe(100);
  });
});
