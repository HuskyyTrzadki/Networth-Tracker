import { expect, test } from "@playwright/test";

import {
  addDays,
  addMarketTransaction,
  clickVisibleByTestId,
  createCashTransactionViaApi,
  createMarketTransactionViaApi,
  createPortfolioViaApi,
  getPortfolioIdByName,
  goToPortfolioDashboard,
  readNetValue,
  readPerformanceAbsolute,
  readPerformanceReturn,
  runSnapshotRebuildUntilIdle,
  selectPortfolioInSwitcher,
  startGuestAndCreatePortfolio,
  switchToPerformanceMode,
  switchToValueMode,
  toIsoDate,
} from "../helpers/portfolio-helpers";

test.setTimeout(420_000);

const expectNetValueClose = async (page: Parameters<typeof readNetValue>[0], value: number) => {
  await expect
    .poll(async () => readNetValue(page), {
      timeout: 8_000,
      intervals: [150, 250, 400],
    })
    .toBeCloseTo(value, 2);
};

const expectPerformanceReturnCloseToZero = async (
  page: Parameters<typeof readPerformanceReturn>[0]
) => {
  await expect
    .poll(async () => readPerformanceReturn(page))
    .toBeCloseTo(0, 3);
};

test("guest portfolio math covers multi-portfolio, FX, consume-cash, sell paths", async ({
  page,
}) => {
  const runSuffix = Date.now().toString().slice(-6);
  const mainPortfolioName = `E2E Main ${runSuffix}`;
  const sidePortfolioName = `E2E Side ${runSuffix}`;
  const yesterdayIso = toIsoDate(addDays(new Date(), -1));

  await test.step("Scenario 1: guest creates first portfolio", async () => {
    await startGuestAndCreatePortfolio(page, mainPortfolioName);
    await goToPortfolioDashboard(page);
  });

  const mainPortfolioId = await getPortfolioIdByName(page, mainPortfolioName);

  const rebuildPortfolioAndAll = async (portfolioId: string) => {
    await runSnapshotRebuildUntilIdle(page, "PORTFOLIO", portfolioId);
    await runSnapshotRebuildUntilIdle(page, "ALL", null);
  };
  let sidePortfolioId = "";

  await test.step("Scenario 2: cash deposit baseline on main portfolio", async () => {
    await createCashTransactionViaApi(page, {
      portfolioId: mainPortfolioId,
      date: yesterdayIso,
      amount: "4000",
      currency: "PLN",
      type: "BUY",
    });

    await rebuildPortfolioAndAll(mainPortfolioId);
    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, mainPortfolioName);
    await expectNetValueClose(page, 4000);
  });

  await test.step("Scenario 3: BUY with consumeCash=true keeps performance stable", async () => {
    await addMarketTransaction(page, {
      portfolioName: mainPortfolioName,
      tickerQuery: "E2EF",
      side: "BUY",
      quantity: "5",
      price: "100",
      consumeCash: true,
      cashCurrency: "PLN",
    });

    await rebuildPortfolioAndAll(mainPortfolioId);
    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, mainPortfolioName);
    await expectNetValueClose(page, 4000);

    await switchToPerformanceMode(page);
    await expectPerformanceReturnCloseToZero(page);
  });

  await test.step("Scenario 4: create second portfolio and seed side cash baseline", async () => {
    sidePortfolioId = await createPortfolioViaApi(page, {
      name: sidePortfolioName,
      baseCurrency: "USD",
    });

    await createCashTransactionViaApi(page, {
      portfolioId: sidePortfolioId,
      date: yesterdayIso,
      amount: "1000",
      currency: "USD",
      type: "BUY",
    });
  });

  await test.step("Scenario 5: side portfolio rising instrument yields positive performance", async () => {
    await createMarketTransactionViaApi(page, {
      portfolioId: sidePortfolioId,
      date: yesterdayIso,
      type: "BUY",
      quantity: "5",
      price: "100",
      consumeCash: true,
      cashCurrency: "USD",
      instrument: {
        providerKey: "E2E-RISE-USD",
        symbol: "E2ER",
        name: "E2E Rise USD",
        currency: "USD",
        instrumentType: "EQUITY",
      },
    });

    await rebuildPortfolioAndAll(sidePortfolioId);

    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, sidePortfolioName);
    await expectNetValueClose(page, 1100);

    await switchToPerformanceMode(page);

    const sideReturn = await readPerformanceReturn(page);
    expect(sideReturn).toBeGreaterThan(0.08);
    expect(sideReturn).toBeLessThan(0.12);
  });

  await test.step("Scenario 6: performance currency conversion keeps return invariant", async () => {
    await clickVisibleByTestId(page, "portfolio-chart-currency-pln");
    const returnPln = await readPerformanceReturn(page);
    const absolutePln = await readPerformanceAbsolute(page);

    await clickVisibleByTestId(page, "portfolio-chart-currency-usd");
    const returnUsd = await readPerformanceReturn(page);
    const absoluteUsd = await readPerformanceAbsolute(page);

    expect(returnUsd).toBeCloseTo(returnPln, 3);
    expect(absolutePln / absoluteUsd).toBeCloseTo(4, 1);
  });

  await test.step("Scenario 7: BUY with consumeCash=false does not inflate performance", async () => {
    await addMarketTransaction(page, {
      portfolioName: mainPortfolioName,
      tickerQuery: "E2EF",
      side: "BUY",
      quantity: "2",
      price: "100",
      consumeCash: false,
    });

    await rebuildPortfolioAndAll(mainPortfolioId);

    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, mainPortfolioName);
    await expectNetValueClose(page, 4800);

    await switchToPerformanceMode(page);
    await expectPerformanceReturnCloseToZero(page);
  });

  await test.step("Scenario 8: SELL with add-to-cash=true keeps value/performance coherent", async () => {
    await addMarketTransaction(page, {
      portfolioName: mainPortfolioName,
      tickerQuery: "E2EF",
      side: "SELL",
      quantity: "1",
      price: "100",
      consumeCash: true,
      cashCurrency: "PLN",
    });

    await rebuildPortfolioAndAll(mainPortfolioId);

    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, mainPortfolioName);
    await expectNetValueClose(page, 4800);

    await switchToPerformanceMode(page);
    await expectPerformanceReturnCloseToZero(page);
  });

  await test.step("Scenario 9: SELL with add-to-cash=false keeps performance neutral", async () => {
    await addMarketTransaction(page, {
      portfolioName: mainPortfolioName,
      tickerQuery: "E2EF",
      side: "SELL",
      quantity: "1",
      price: "100",
      consumeCash: false,
    });

    await rebuildPortfolioAndAll(mainPortfolioId);

    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, mainPortfolioName);
    await expectNetValueClose(page, 4400);

    await switchToPerformanceMode(page);
    await expectPerformanceReturnCloseToZero(page);
  });

  await test.step("Scenario 10: aggregate dashboard sums multiple portfolios", async () => {
    await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
    await selectPortfolioInSwitcher(page, "Wszystkie portfele");
    await expectNetValueClose(page, 8800);
  });

  await test.step("Scenario 11: value/performance widgets render without NaN or partial-state regression", async () => {
    const standaloneNaN = page.locator("text=/\\bNaN\\b/");

    await switchToValueMode(page);
    await expect(standaloneNaN).toHaveCount(0);
    await expect(page.locator("text=Dane wyceny są częściowe")).toHaveCount(0);

    await switchToPerformanceMode(page);
    await expect(standaloneNaN).toHaveCount(0);
  });

  await test.step("Scenario 12: transaction ledger contains generated rows", async () => {
    await page.goto("/transactions", { waitUntil: "domcontentloaded" });
    const rowCount = await page.locator("[data-testid='transactions-ledger-row']").count();
    expect(rowCount).toBeGreaterThanOrEqual(10);
  });
});
