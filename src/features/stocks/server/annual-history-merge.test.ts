import { describe, expect, it } from "vitest";

import {
  buildAsOfAnnualSeries,
  fillOutsidePrimaryCoverage,
  mergeAnnualNumericHistory,
  pickYearEndValuesFromHistory,
} from "./annual-history-merge";

describe("annual-history-merge", () => {
  it("merges primary and CompaniesMarketCap annual points with primary priority", () => {
    const result = mergeAnnualNumericHistory(
      [
        {
          year: 2024,
          date: "2024-12-31",
          value: 40,
          isTtm: false,
          source: "primary",
        },
      ],
      [
        {
          year: 2023,
          value: 25,
          changePercent: null,
          isTtm: false,
          periodLabel: null,
        },
        {
          year: 2024,
          value: 44,
          changePercent: null,
          isTtm: false,
          periodLabel: null,
        },
      ]
    );

    expect(result).toEqual([
      {
        year: 2023,
        date: "2023-12-31",
        value: 25,
        isTtm: false,
        source: "companiesmarketcap",
      },
      {
        year: 2024,
        date: "2024-12-31",
        value: 40,
        isTtm: false,
        source: "primary",
      },
    ]);
  });

  it("builds as-of annual step values and fills only outside primary coverage", () => {
    const annualHistory = [
      {
        year: 2021,
        date: "2021-12-31",
        value: 10,
        isTtm: false,
        source: "companiesmarketcap" as const,
      },
      {
        year: 2022,
        date: "2022-12-31",
        value: 20,
        isTtm: false,
        source: "companiesmarketcap" as const,
      },
    ];
    const dates = [
      "2021-06-30",
      "2021-12-31",
      "2022-06-30",
      "2022-12-31",
      "2023-06-30",
    ];

    expect(buildAsOfAnnualSeries(dates, annualHistory)).toEqual([
      null,
      10,
      10,
      20,
      20,
    ]);

    expect(
      fillOutsidePrimaryCoverage(dates, [null, null, 30, 31, null], annualHistory)
    ).toEqual([null, 10, 30, 31, 20]);
  });

  it("picks the last finite value per year from dense history", () => {
    const result = pickYearEndValuesFromHistory(
      [
        { t: "2024-01-10T00:00:00.000Z", value: 12 },
        { t: "2024-12-20T00:00:00.000Z", value: 18 },
        { t: "2025-11-30T00:00:00.000Z", value: 22 },
      ],
      {
        getDate: (point) => point.t.slice(0, 10),
        getValue: (point) => point.value,
      }
    );

    expect(result).toEqual([
      {
        year: 2024,
        date: "2024-12-31",
        value: 18,
        isTtm: false,
        source: "primary",
      },
      {
        year: 2025,
        date: "2025-12-31",
        value: 22,
        isTtm: false,
        source: "primary",
      },
    ]);
  });
});
