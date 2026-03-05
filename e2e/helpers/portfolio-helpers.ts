import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

type SnapshotScope = "PORTFOLIO" | "ALL";

type RebuildResponse = Readonly<{
  status: "idle" | "queued" | "running" | "failed";
  dirtyFrom: string | null;
  message: string | null;
}>;

const cleanNumeric = (text: string) =>
  text
    .replace(/\u00a0/g, " ")
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "")
    .replace(",", ".");

export const parsePolishNumber = (text: string): number => {
  const cleaned = cleanNumeric(text);
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Cannot parse numeric value from: ${text}`);
  }
  return parsed;
};

export const parsePercentValue = (text: string): number => {
  const parsed = parsePolishNumber(text.replace("%", ""));
  return parsed / 100;
};

export const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toCalendarDayKey = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US");
};

export async function startGuestAndCreatePortfolio(
  page: Page,
  portfolioName: string
) {
  await page.goto("/");
  await page.getByRole("button", { name: "Wypróbuj jako gość" }).click();
  await page.waitForURL("**/onboarding");

  await page.getByTestId("onboarding-portfolio-name-input").fill(portfolioName);
  await page.getByTestId("onboarding-create-portfolio-submit").click();

  await expect(
    page.getByRole("heading", { name: "Wybierz szybszy start albo pełną historię." })
  ).toBeVisible();
}

export async function goToPortfolioDashboard(page: Page) {
  await page.goto("/portfolio", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("portfolio-add-transaction-cta")).toBeVisible({
    timeout: 45_000,
  });
}

export async function openAddTransactionModal(page: Page) {
  await page.goto("/transactions/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("add-transaction-dialog")).toBeVisible();
  await expect(
    page.locator("[data-testid='transaction-type-buy']:visible").first()
  ).toBeVisible();
}

export async function selectRadixOptionByText(
  page: Page,
  triggerTestId: string,
  optionLabel: string
) {
  const trigger = page.locator(`[data-testid='${triggerTestId}']:visible`).first();
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeEnabled();
  const currentValueLabel = (await trigger.innerText()).trim();
  if (currentValueLabel.includes(optionLabel)) {
    return;
  }
  await trigger.click({ force: true });
  const option = page.locator("[role='option']").filter({ hasText: optionLabel }).first();
  await expect(option).toBeVisible();
  await option.click({ force: true });
}

export async function clickVisibleByTestId(page: Page, testId: string) {
  const target = page.locator(`[data-testid='${testId}']:visible`).first();
  await expect(target).toBeVisible();
  await target.click({ force: true });
}

export async function setDateFromPicker(
  page: Page,
  pickerTestId: string,
  isoDate: string
) {
  await page.getByTestId(pickerTestId).click({ force: true });
  const dayKey = toCalendarDayKey(isoDate);
  const dayButton = page.locator(`button[data-day='${dayKey}']`).first();
  await expect(dayButton).toBeVisible();
  await dayButton.click({ force: true });
}

export async function ensureCheckboxState(
  page: Page,
  checkboxTestId: string,
  shouldBeChecked: boolean
) {
  const checkbox = page.getByTestId(checkboxTestId);
  await expect(checkbox).toBeVisible();
  const state = await checkbox.getAttribute("data-state");
  const isChecked = state === "checked";
  if (isChecked !== shouldBeChecked) {
    await checkbox.click();
  }
}

async function selectInstrumentByTicker(page: Page, tickerQuery: string) {
  await page.getByTestId("transaction-instrument-combobox").click();
  const commandInput = page.locator("input[cmdk-input]");
  await expect(commandInput).toBeVisible();
  await commandInput.fill(tickerQuery);

  const option = page
    .locator("[cmdk-item]")
    .filter({ hasText: tickerQuery })
    .first();
  await expect(option).toBeVisible();
  await option.click();
}

async function ensureTransactionType(
  page: Page,
  type: "BUY" | "SELL"
) {
  const testId = type === "BUY" ? "transaction-type-buy" : "transaction-type-sell";
  const tab = page.locator(`[data-testid='${testId}']:visible`).first();
  await expect(tab).toBeVisible();

  const isActive = (await tab.getAttribute("aria-selected")) === "true";
  if (!isActive) {
    await tab.click({ force: true });
  }
}

export async function addCashTransaction(
  page: Page,
  input: Readonly<{
    portfolioName: string;
    type: "BUY" | "SELL";
    amount: string;
    cashCurrency: "PLN" | "USD" | "EUR";
    tradeDate?: string;
  }>
) {
  await openAddTransactionModal(page);

  await page.getByTestId("transaction-asset-tab-cash").click();
  await selectRadixOptionByText(page, "transaction-portfolio-select", input.portfolioName);
  await page
    .locator(
      `[data-testid='${input.type === "BUY" ? "transaction-type-buy" : "transaction-type-sell"}']:visible`
    )
    .first()
    .click({ force: true });

  const cashCurrencyTrigger = page
    .locator("[data-testid='transaction-cash-asset-currency-select']:visible")
    .first();
  await expect(cashCurrencyTrigger).toBeVisible();
  await expect(cashCurrencyTrigger).toBeEnabled();
  await cashCurrencyTrigger.click({ force: true });
  const cashCurrencyOption = page
    .locator("[role='option']")
    .filter({ hasText: input.cashCurrency })
    .first();
  await expect(cashCurrencyOption).toBeVisible();
  await cashCurrencyOption.click({ force: true });

  if (input.tradeDate) {
    await setDateFromPicker(page, "transaction-date-picker", input.tradeDate);
  }

  const dialog = page.getByTestId("add-transaction-dialog");
  await dialog.locator("input[name='quantity']").fill(input.amount);

  await page.getByTestId("transaction-submit-close").click();
  await expect(page.getByTestId("add-transaction-dialog")).toBeHidden();
}

export async function addMarketTransaction(
  page: Page,
  input: Readonly<{
    portfolioName: string;
    tickerQuery: string;
    side: "BUY" | "SELL";
    quantity: string;
    price: string;
    consumeCash: boolean;
    tradeDate?: string;
    cashCurrency?: "PLN" | "USD" | "EUR";
  }>
) {
  await openAddTransactionModal(page);

  await page.getByTestId("transaction-asset-tab-market").click();
  await selectRadixOptionByText(page, "transaction-portfolio-select", input.portfolioName);
  await ensureTransactionType(page, input.side);

  await selectInstrumentByTicker(page, input.tickerQuery);
  if (input.tradeDate) {
    await setDateFromPicker(page, "transaction-date-picker", input.tradeDate);
  }

  const dialog = page.getByTestId("add-transaction-dialog");
  await dialog.locator("input[name='quantity']").fill(input.quantity);
  await dialog.locator("input[name='price']").fill(input.price);
  await dialog.locator("input[name='fee']").fill("0");

  await ensureCheckboxState(
    page,
    "transaction-consume-cash-checkbox",
    input.consumeCash
  );

  if (input.consumeCash && input.cashCurrency) {
    await selectRadixOptionByText(
      page,
      "transaction-cash-currency-select",
      input.cashCurrency
    );
  }

  await page.getByTestId("transaction-submit-close").click();
  await expect(page.getByTestId("add-transaction-dialog")).toBeHidden();
}

export async function getPortfolioIdByName(page: Page, portfolioName: string) {
  const response = await page.request.get("/api/portfolios");
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as Readonly<{
    portfolios: readonly { id: string; name: string }[];
  }>;

  const row = payload.portfolios.find((portfolio) => portfolio.name === portfolioName);
  if (!row) {
    throw new Error(`Portfolio not found by name: ${portfolioName}`);
  }

  return row.id;
}

export async function createCashTransactionViaApi(
  page: Page,
  input: Readonly<{
    portfolioId: string;
    date: string;
    amount: string;
    currency: "PLN" | "USD" | "EUR";
    type: "BUY" | "SELL";
  }>
) {
  const response = await page.request.post("/api/transactions", {
    data: {
      portfolioId: input.portfolioId,
      clientRequestId: randomUUID(),
      type: input.type,
      date: input.date,
      quantity: input.amount,
      price: "1",
      fee: "0",
      consumeCash: false,
      cashflowType: input.type === "BUY" ? "DEPOSIT" : "WITHDRAWAL",
      instrument: {
        provider: "system",
        providerKey: input.currency,
        symbol: input.currency,
        name: `Gotówka ${input.currency}`,
        currency: input.currency,
        instrumentType: "CURRENCY",
      },
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function createMarketTransactionViaApi(
  page: Page,
  input: Readonly<{
    portfolioId: string;
    date: string;
    type: "BUY" | "SELL";
    quantity: string;
    price: string;
    consumeCash: boolean;
    cashCurrency?: "PLN" | "USD" | "EUR";
    instrument: Readonly<{
      providerKey: string;
      symbol: string;
      name: string;
      currency: "PLN" | "USD" | "EUR";
      instrumentType?: "EQUITY" | "ETF" | "CRYPTO" | "CURRENCY";
      exchange?: string;
      region?: string;
    }>;
  }>
) {
  const response = await page.request.post("/api/transactions", {
    data: {
      portfolioId: input.portfolioId,
      clientRequestId: randomUUID(),
      type: input.type,
      date: input.date,
      quantity: input.quantity,
      price: input.price,
      fee: "0",
      consumeCash: input.consumeCash,
      cashCurrency: input.consumeCash ? input.cashCurrency : undefined,
      instrument: {
        provider: "yahoo",
        providerKey: input.instrument.providerKey,
        symbol: input.instrument.symbol,
        name: input.instrument.name,
        currency: input.instrument.currency,
        instrumentType: input.instrument.instrumentType ?? "EQUITY",
        exchange: input.instrument.exchange ?? "E2E",
        region: input.instrument.region ?? "US",
      },
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function createPortfolioViaApi(
  page: Page,
  input: Readonly<{
    name: string;
    baseCurrency: "PLN" | "USD" | "EUR";
    isTaxAdvantaged?: boolean;
  }>
) {
  const response = await page.request.post("/api/portfolios", {
    data: {
      name: input.name,
      baseCurrency: input.baseCurrency,
      isTaxAdvantaged: input.isTaxAdvantaged ?? false,
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as Readonly<{ id: string }>;
  return payload.id;
}

export async function runSnapshotRebuildUntilIdle(
  page: Page,
  scope: SnapshotScope,
  portfolioId: string | null
) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const response = await page.request.post("/api/portfolio-snapshots/rebuild", {
      data: {
        scope,
        portfolioId: scope === "PORTFOLIO" ? portfolioId : null,
      },
    });

    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as RebuildResponse;

    if (payload.status === "failed") {
      throw new Error(payload.message ?? "Snapshot rebuild failed.");
    }

    if (payload.status === "idle" && payload.dirtyFrom === null) {
      return;
    }

    await page.waitForTimeout(150);
  }

  throw new Error(`Snapshot rebuild did not finish for scope=${scope}.`);
}

export async function selectPortfolioInSwitcher(
  page: Page,
  portfolioName: string | "Wszystkie portfele"
) {
  await selectRadixOptionByText(page, "portfolio-switcher-select", portfolioName);
}

export async function readNetValue(page: Page) {
  const text = await page
    .locator("[data-testid='portfolio-net-value']:visible")
    .first()
    .innerText();
  return parsePolishNumber(text);
}

export async function switchToPerformanceMode(page: Page) {
  const mode = page
    .locator("[data-testid='portfolio-chart-mode-performance']:visible")
    .first();
  await expect(mode).toBeVisible();
  const isActive = (await mode.getAttribute("aria-pressed")) === "true";
  if (!isActive) {
    await mode.click({ force: true });
  }
}

export async function switchToValueMode(page: Page) {
  const mode = page
    .locator("[data-testid='portfolio-chart-mode-value']:visible")
    .first();
  await expect(mode).toBeVisible();
  const isActive = (await mode.getAttribute("aria-pressed")) === "true";
  if (!isActive) {
    await mode.click({ force: true });
  }
}

export async function readPerformanceReturn(page: Page) {
  const text = await page
    .locator("[data-testid='portfolio-performance-period-return']:visible")
    .first()
    .innerText();
  return parsePercentValue(text);
}

export async function readPerformanceAbsolute(page: Page) {
  const text = await page
    .locator("[data-testid='portfolio-performance-period-absolute']:visible")
    .first()
    .innerText();
  return parsePolishNumber(text);
}
