import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HistoricalPriceAssistHint } from "./HistoricalPriceAssistHint";

describe("HistoricalPriceAssistHint", () => {
  it("shows warning even when session range is unavailable", () => {
    render(
      <HistoricalPriceAssistHint
        errorMessage={null}
        isLoading={false}
        hint={{
          selectedDate: "2026-02-07",
          ohlc: null,
          suggestedPrice: null,
          range: null,
          warning: "Brak danych rynkowych.",
          marketDate: null,
          isFilledFromPreviousSession: true,
        }}
      />
    );

    expect(screen.getByText("Brak danych rynkowych.")).toBeInTheDocument();
  });
});
