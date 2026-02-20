import { describe, expect, it } from "vitest";

import { __test__ } from "./get-instrument-price-on-date";

describe("resolveFallbackWarning", () => {
  it("returns same-day pending-close warning on weekday when market data falls back", () => {
    const warning = __test__.resolveFallbackWarning({
      selectedDate: "2026-02-09",
      marketDate: "2026-02-06",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-09T10:00:00.000Z"),
    });

    expect(warning).toBe(
      "Dzisiejsza sesja może jeszcze trwać. Użyto ostatniego dostępnego zamknięcia."
    );
  });

  it("returns no-session warning for past dates", () => {
    const warning = __test__.resolveFallbackWarning({
      selectedDate: "2026-02-06",
      marketDate: "2026-02-05",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-09T10:00:00.000Z"),
    });

    expect(warning).toBe(
      "Wybrany dzień był bez sesji. Użyto ostatniej dostępnej sesji."
    );
  });

  it("returns no-session warning for same-day weekend fallback", () => {
    const warning = __test__.resolveFallbackWarning({
      selectedDate: "2026-02-08",
      marketDate: "2026-02-06",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-08T10:00:00.000Z"),
    });

    expect(warning).toBe(
      "Wybrany dzień był bez sesji. Użyto ostatniej dostępnej sesji."
    );
  });
});

describe("isSelectedDateTodayInTimeZone", () => {
  it("matches selected date against exchange timezone day", () => {
    const result = __test__.isSelectedDateTodayInTimeZone({
      selectedDate: "2026-02-09",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-09T10:00:00.000Z"),
    });

    expect(result).toBe(true);
  });

  it("returns false when selected date is not the current exchange day", () => {
    const result = __test__.isSelectedDateTodayInTimeZone({
      selectedDate: "2026-02-08",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-09T10:00:00.000Z"),
    });

    expect(result).toBe(false);
  });
});

describe("shouldRevalidateExactSession", () => {
  it("returns true for historical weekday fallback", () => {
    const result = __test__.shouldRevalidateExactSession({
      selectedDate: "2026-02-19",
      marketDate: "2026-02-16",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-20T10:00:00.000Z"),
    });

    expect(result).toBe(true);
  });

  it("returns false for weekend selected date", () => {
    const result = __test__.shouldRevalidateExactSession({
      selectedDate: "2026-02-08",
      marketDate: "2026-02-06",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-09T10:00:00.000Z"),
    });

    expect(result).toBe(false);
  });

  it("returns false for today fallback", () => {
    const result = __test__.shouldRevalidateExactSession({
      selectedDate: "2026-02-20",
      marketDate: "2026-02-19",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-20T10:00:00.000Z"),
    });

    expect(result).toBe(false);
  });

  it("returns false when market date already matches selected date", () => {
    const result = __test__.shouldRevalidateExactSession({
      selectedDate: "2026-02-19",
      marketDate: "2026-02-19",
      exchangeTimezone: "Europe/Warsaw",
      now: new Date("2026-02-20T10:00:00.000Z"),
    });

    expect(result).toBe(false);
  });
});
