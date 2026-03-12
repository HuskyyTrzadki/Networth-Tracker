import { describe, expect, it } from "vitest";

import {
  buildCompaniesMarketCapSlugCandidates,
  normalizeCompaniesMarketCapMoneyValue,
  normalizeCompaniesMarketCapPercentChange,
  normalizeCompaniesMarketCapRatioValue,
  parseCompaniesMarketCapMetricPage,
} from "../../../../../scripts/lib/companiesmarketcap-scrape.mjs";

const REVENUE_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>CD Projekt (CDR.WA) - Revenue</title>
  </head>
  <body>
    <div class="profile-container">
      <h1>Revenue for CD Projekt (CDR.WA)</h1>
      <h2><strong>Revenue in 2025 (TTM): <span class="background-ya">$0.29 Billion USD</span></strong></h2>
      <h3>Annual revenue</h3>
      <div>
        <table class="table">
          <tbody>
            <tr>
              <td><span class="year">2025</span> (TTM) <img tooltip-title="2 Oct 2024 - 30 Sep 2025"></td>
              <td>$0.29 B</td>
              <td class="percentage-green">20.06%</td>
            </tr>
            <tr>
              <td><span class="year">2024</span> <img tooltip-title="1 Jan 2024 - 31 Dec 2024"></td>
              <td>$0.24 B</td>
              <td class="percentage-red">-16.9%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </body>
</html>
`;

describe("companiesmarketcap parser", () => {
  it("normalizes money and ratio values", () => {
    expect(normalizeCompaniesMarketCapMoneyValue("$0.29 B")).toBe(290_000_000);
    expect(normalizeCompaniesMarketCapMoneyValue("$87.92 M")).toBe(87_920_000);
    expect(normalizeCompaniesMarketCapRatioValue("23.7")).toBe(23.7);
    expect(normalizeCompaniesMarketCapPercentChange("-16.9%")).toBeCloseTo(-0.169, 6);
  });

  it("builds sensible slug candidates from company names", () => {
    expect(
      buildCompaniesMarketCapSlugCandidates({
        name: "CD Projekt S.A.",
      })
    ).toContain("cd-projekt");
  });

  it("parses annual history and ttm headline from a revenue page", () => {
    const parsed = parseCompaniesMarketCapMetricPage({
      html: REVENUE_HTML,
      metric: "revenue",
    });

    expect(parsed.title).toBe("CD Projekt (CDR.WA) - Revenue");
    expect(parsed.ttmValue).toBe(290_000_000);
    expect(parsed.annualHistory).toHaveLength(2);
    expect(parsed.annualHistory[0]).toMatchObject({
      year: 2025,
      value: 290_000_000,
      isTtm: true,
      periodLabel: "2 Oct 2024 - 30 Sep 2025",
    });
    expect(parsed.annualHistory[0]?.changePercent).toBeCloseTo(0.2006, 6);
    expect(parsed.annualHistory[1]).toMatchObject({
      year: 2024,
      value: 240_000_000,
      isTtm: false,
      periodLabel: "1 Jan 2024 - 31 Dec 2024",
    });
    expect(parsed.annualHistory[1]?.changePercent).toBeCloseTo(-0.169, 6);
  });
});
