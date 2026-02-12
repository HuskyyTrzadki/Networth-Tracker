import { describe, expect, it } from "vitest";

import { buildPeOverlaySeries } from "./build-pe-overlay-series";

describe("buildPeOverlaySeries", () => {
  it("maps EPS events as step function and computes PE", () => {
    const result = buildPeOverlaySeries(
      [
        {
          time: "2025-01-01T00:00:00.000Z",
          date: "2025-01-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 100,
          adjClose: 100,
          price: 100,
        },
        {
          time: "2025-04-01T00:00:00.000Z",
          date: "2025-04-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 120,
          adjClose: 120,
          price: 120,
        },
      ],
      [
        { periodEndDate: "2024-12-31", epsTtm: 5 },
        { periodEndDate: "2025-03-31", epsTtm: 6 },
      ]
    );

    expect(result[0]).toEqual({
      t: "2025-01-01T00:00:00.000Z",
      price: 100,
      epsTtm: 5,
      revenueTtm: null,
      pe: 20,
      peLabel: null,
    });
    expect(result[1]).toEqual({
      t: "2025-04-01T00:00:00.000Z",
      price: 120,
      epsTtm: 6,
      revenueTtm: null,
      pe: 20,
      peLabel: null,
    });
  });

  it("marks PE as N/M for non-positive EPS and '-' for missing EPS", () => {
    const result = buildPeOverlaySeries(
      [
        {
          time: "2025-01-01T00:00:00.000Z",
          date: "2025-01-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 100,
          adjClose: 100,
          price: 100,
        },
        {
          time: "2025-02-01T00:00:00.000Z",
          date: "2025-02-01",
          currency: "USD",
          timezone: "America/New_York",
          close: 95,
          adjClose: null,
          price: 95,
        },
      ],
      [{ periodEndDate: "2025-01-15", epsTtm: -2 }]
    );

    expect(result[0]).toEqual({
      t: "2025-01-01T00:00:00.000Z",
      price: 100,
      epsTtm: null,
      revenueTtm: null,
      pe: null,
      peLabel: "-",
    });
    expect(result[1]).toEqual({
      t: "2025-02-01T00:00:00.000Z",
      price: 95,
      epsTtm: -2,
      revenueTtm: null,
      pe: null,
      peLabel: "N/M",
    });
  });
});
