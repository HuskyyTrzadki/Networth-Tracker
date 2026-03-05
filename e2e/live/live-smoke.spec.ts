import { expect, test } from "@playwright/test";

import {
  addCashTransaction,
  goToPortfolioDashboard,
  startGuestAndCreatePortfolio,
  switchToPerformanceMode,
  switchToValueMode,
} from "../helpers/portfolio-helpers";

test("live smoke: guest can add transaction and charts render without NaN", async ({
  page,
}) => {
  const runSuffix = Date.now().toString().slice(-6);
  const portfolioName = `E2E Live ${runSuffix}`;

  await startGuestAndCreatePortfolio(page, portfolioName);
  await goToPortfolioDashboard(page);

  await addCashTransaction(page, {
    portfolioName,
    type: "BUY",
    amount: "2000",
    cashCurrency: "PLN",
  });

  await page.goto("/portfolio");
  const standaloneNaN = page.locator("text=/\\bNaN\\b/");

  await switchToValueMode(page);
  await expect(standaloneNaN).toHaveCount(0);
  await expect(page.locator("text=Błąd przebudowy")).toHaveCount(0);

  await switchToPerformanceMode(page);
  await expect(standaloneNaN).toHaveCount(0);
  await expect(page.getByTestId("portfolio-chart-mode-performance")).toBeVisible();
});
