import { describe, expect, it } from "vitest";

import { __test__ } from "./get-eps-ttm-events-cached";

describe("getEpsTtmEventsCached helpers", () => {
  it("parses Date and string dates and extracts trailing EPS fields", () => {
    const rows = __test__.parseYahooRows([
      {
        date: new Date("2024-12-31T00:00:00.000Z"),
        dilutedEPS: 5.5,
      },
      {
        date: "2025-03-31",
        trailingDilutedEPS: 6.1,
      },
    ]);

    expect(rows).toEqual([
      { periodEndDate: "2024-12-31", epsTtm: 5.5 },
      { periodEndDate: "2025-03-31", epsTtm: 6.1 },
    ]);
  });

  it("unwraps raw timeseries envelope when payload is not a direct array", () => {
    const rows = __test__.unwrapYahooRows({
      timeseries: {
        result: [{ date: "2025-06-30", basicEPS: 6.9 }],
      },
    });

    expect(rows).toEqual([{ date: "2025-06-30", basicEPS: 6.9 }]);
  });

  it("parses unix-second timestamps instead of producing 1970 dates", () => {
    const rows = __test__.parseYahooRows([
      {
        date: 1_717_113_600,
        basicEPS: 7.25,
      },
    ]);

    expect(rows[0]).toEqual({
      periodEndDate: "2024-05-31",
      epsTtm: 7.25,
    });
  });

  it("builds annual EPS fallback events and skips future annual points", () => {
    const annualRows = __test__.parseAnnualRows([
      {
        date: "2021-12-31",
        periodType: "12M",
        dilutedEPS: 1.25,
      },
      {
        date: "2099-12-31",
        periodType: "12M",
        dilutedEPS: 999,
      },
    ]);

    const approx = __test__.buildApproxTtmEventsFromAnnual(annualRows);

    expect(approx).toEqual([{ periodEndDate: "2021-12-31", epsTtm: 1.25 }]);
  });

  it("merges EPS sources by priority: trailing -> quarterly-ttm -> annual", () => {
    const merged = __test__.mergeEpsEventsWithPriority([
      [
        { periodEndDate: "2023-09-30", epsTtm: 2.1 },
        { periodEndDate: "2023-12-31", epsTtm: 2.4 },
      ],
      [
        { periodEndDate: "2023-06-30", epsTtm: 1.8 },
        { periodEndDate: "2023-09-30", epsTtm: 2.0 },
      ],
      [
        { periodEndDate: "2022-12-31", epsTtm: 1.4 },
        { periodEndDate: "2023-06-30", epsTtm: 1.7 },
      ],
    ]);

    expect(merged).toEqual([
      { periodEndDate: "2022-12-31", epsTtm: 1.4 },
      { periodEndDate: "2023-06-30", epsTtm: 1.8 },
      { periodEndDate: "2023-09-30", epsTtm: 2.1 },
      { periodEndDate: "2023-12-31", epsTtm: 2.4 },
    ]);
  });
});
