import { describe, expect, it } from "vitest";

import { buildDividendsInsightWidget } from "./stock-report-dividends-insight";

describe("stock-report-dividends-insight", () => {
  it("groups Yahoo dividend events into quarterly and annual per-share series", () => {
    const widget = buildDividendsInsightWidget({
      pastEvents: [
        { eventDate: "2024-02-15", amountPerShare: "0.25" },
        { eventDate: "2024-05-15", amountPerShare: "0.25" },
        { eventDate: "2024-08-15", amountPerShare: "0.25" },
        { eventDate: "2024-11-15", amountPerShare: "0.25" },
        { eventDate: "2025-02-15", amountPerShare: "0.30" },
      ],
      upcomingEvent: null,
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toEqual([
        {
          period: "Q1 24",
          primary: 0.25,
          date: "2024-03-31",
        },
        {
          period: "Q2 24",
          primary: 0.25,
          date: "2024-06-30",
        },
        {
          period: "Q3 24",
          primary: 0.25,
          date: "2024-09-30",
        },
        {
          period: "Q4 24",
          primary: 0.25,
          date: "2024-12-31",
        },
        {
          period: "Q1 25",
          primary: 0.3,
          date: "2025-03-31",
        },
      ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      {
        period: "FY 24",
        primary: 1,
        date: "2024-12-31",
      },
      {
        period: "FY 25",
        primary: 0.3,
        date: "2025-12-31",
      },
    ]);
  });

  it("fills missing quarters and years with zero when payouts are sparse", () => {
    const widget = buildDividendsInsightWidget({
      pastEvents: [
        { eventDate: "2023-06-10", amountPerShare: "0.5" },
        { eventDate: "2025-06-10", amountPerShare: "0.7" },
      ],
      upcomingEvent: null,
    });

    expect(widget?.datasets.find((dataset) => dataset.frequency === "quarterly")?.points)
      .toEqual([
        { period: "Q2 23", primary: 0.5, date: "2023-06-30" },
        { period: "Q3 23", primary: 0, date: "2023-09-30" },
        { period: "Q4 23", primary: 0, date: "2023-12-31" },
        { period: "Q1 24", primary: 0, date: "2024-03-31" },
        { period: "Q2 24", primary: 0, date: "2024-06-30" },
        { period: "Q3 24", primary: 0, date: "2024-09-30" },
        { period: "Q4 24", primary: 0, date: "2024-12-31" },
        { period: "Q1 25", primary: 0, date: "2025-03-31" },
        { period: "Q2 25", primary: 0.7, date: "2025-06-30" },
      ]);
    expect(widget?.datasets.find((dataset) => dataset.frequency === "annual")?.points).toEqual([
      { period: "FY 23", primary: 0.5, date: "2023-12-31" },
      { period: "FY 24", primary: 0, date: "2024-12-31" },
      { period: "FY 25", primary: 0.7, date: "2025-12-31" },
    ]);
  });
});
