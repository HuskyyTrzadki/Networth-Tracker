import { describe, expect, it } from "vitest";

import {
  buildProfitConversionViewModel,
  PROFIT_CONVERSION_EMPTY_STATE,
} from "./stock-report-profit-conversion";

describe("buildProfitConversionViewModel", () => {
  it("returns null when profitability data is missing", () => {
    expect(buildProfitConversionViewModel(null)).toBeNull();
    expect(PROFIT_CONVERSION_EMPTY_STATE).toContain("Brak kwartalnego");
  });

  it("builds metric cards and Sankey slices from a quarterly snapshot", () => {
    const viewModel = buildProfitConversionViewModel({
      periodEndDate: "2025-12-31",
      revenue: 100,
      costOfRevenue: 39,
      operatingExpense: 27,
      operatingIncome: 34,
      taxesAndOther: 4,
      netIncome: 30,
      grossMarginPercent: 61,
      operatingMarginPercent: 34,
      netMarginPercent: 30,
      costOfRevenuePercent: 39,
      operatingExpensePercent: 27,
      taxesAndOtherPercent: 4,
    });

    expect(viewModel?.periodLabel).toContain("Q4");
    expect(viewModel?.metrics[0]?.label).toBe("Przychody (waluta spolki)");
    expect(viewModel?.slices.map((slice) => slice.label)).toEqual([
      "Koszt dostarczenia produktu/uslugi",
      "Koszty operacyjne",
      "Podatki i pozostale",
      "Zysk netto",
    ]);
    expect(viewModel?.sankeyCostSlices.reduce((sum, slice) => sum + slice.valuePercent, 0)).toBe(
      70
    );
    expect(viewModel?.netMarginPercent).toBe(30);
  });
});
