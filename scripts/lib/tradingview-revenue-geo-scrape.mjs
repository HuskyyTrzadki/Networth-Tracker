const NON_NUMERIC_MARKS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u00A0\u202F\s]/g;
const EMPTY_MARKER = /^(?:-|—|–|N\/A)$/i;
const UNIT_MULTIPLIER = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };

const sanitize = (value) => (value ?? "").trim().toUpperCase();

const toNumber = (input) => {
  const commaIndex = input.lastIndexOf(",");
  const dotIndex = input.lastIndexOf(".");
  let normalized = input;

  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.split(thousandsSeparator).join("");
    normalized = normalized.replace(decimalSeparator, ".");
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTradingViewMoneyValue = (rawValue) => {
  const stripped = rawValue.replace(NON_NUMERIC_MARKS, "").trim();
  if (stripped.length === 0 || EMPTY_MARKER.test(stripped)) return null;

  const unitMatch = stripped.match(/[KMBT]$/i);
  const unit = unitMatch?.[0]?.toUpperCase() ?? null;
  const numericPart = unit ? stripped.slice(0, -1) : stripped;
  const numericValue = toNumber(numericPart);

  if (numericValue === null) return null;
  const multiplier = unit ? UNIT_MULTIPLIER[unit] : 1;
  if (!Number.isFinite(multiplier)) return null;

  return numericValue * multiplier;
};

const mapToTradingViewSymbolPath = ({ exchange, providerKey, symbol }) => {
  const normalizedExchange = sanitize(exchange);
  const tickerSource = sanitize(providerKey) || sanitize(symbol);

  if (!tickerSource) return { ok: false, reason: "MISSING_TICKER" };

  if (
    normalizedExchange === "NASDAQ" ||
    normalizedExchange === "NYSE" ||
    normalizedExchange === "NMS"
  ) {
    const venue = normalizedExchange === "NMS" ? "NASDAQ" : normalizedExchange;
    return {
      ok: true,
      symbolPath: `${venue}-${tickerSource}`,
      venue,
      ticker: tickerSource,
    };
  }

  if (normalizedExchange === "WSE") {
    const ticker = tickerSource.endsWith(".WA")
      ? tickerSource.slice(0, -3)
      : tickerSource;
    if (!ticker) return { ok: false, reason: "MISSING_TICKER" };

    return { ok: true, symbolPath: `GPW-${ticker}`, venue: "GPW", ticker };
  }

  if (normalizedExchange === "PARIS") {
    const ticker = tickerSource.endsWith(".PA")
      ? tickerSource.slice(0, -3)
      : tickerSource;
    if (!ticker) return { ok: false, reason: "MISSING_TICKER" };

    return { ok: true, symbolPath: `EURONEXT-${ticker}`, venue: "EURONEXT", ticker };
  }

  return { ok: false, reason: "UNSUPPORTED_EXCHANGE" };
};

const ensureCountrySectionRendered = async (page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    window.scrollTo(0, Math.round(document.body.scrollHeight * 0.75));
  });

  await page.waitForTimeout(900);

  try {
    await page.waitForFunction(
      () => {
        const text = document.body.textContent ?? "";
        return text.includes("By country") || text.includes("Według kraju");
      },
      { timeout: 10000 }
    );
  } catch {
    // best effort
  }
};

const extractCountryRows = async (page) =>
  page.evaluate(() => {
    const titleNode = Array.from(document.querySelectorAll("div,span,h2,h3")).find(
      (node) => {
        const text = node.textContent?.trim();
        return text === "By country" || text === "Według kraju";
      }
    );

    if (!titleNode) {
      return { ok: false, reason: "COUNTRY_SECTION_NOT_FOUND", rows: [], seriesOrder: [] };
    }

    const section = titleNode.closest('div[class*="section-"]') ?? titleNode.parentElement;
    if (!section) {
      return {
        ok: false,
        reason: "COUNTRY_SECTION_CONTAINER_NOT_FOUND",
        rows: [],
        seriesOrder: [],
      };
    }

    const rows = Array.from(section.querySelectorAll("[data-name]"))
      .map((rowNode) => {
        const country = rowNode.getAttribute("data-name")?.trim() ?? "";
        const rawValues = Array.from(rowNode.querySelectorAll('div[class*="value-"]'))
          .map((valueNode) => valueNode.textContent?.trim() ?? "")
          .filter((text) => text.length > 0);

        return { country, rawValues };
      })
      .filter((row) => row.country.length > 0 && row.rawValues.length > 0);

    if (rows.length === 0) {
      return { ok: false, reason: "NO_COUNTRY_ROWS", rows: [], seriesOrder: [] };
    }

    return { ok: true, reason: null, rows, seriesOrder: [] };
  });

const toSnapshotPayload = ({
  provider,
  providerKey,
  sourceUrl,
  rows,
  seriesOrder,
  metadata,
  fetchedAt,
}) => {
  const historyByCountry = {};

  rows.forEach((row) => {
    const normalizedValues = row.rawValues
      .map((rawValue) => normalizeTradingViewMoneyValue(rawValue))
      .filter((value) => typeof value === "number");

    if (normalizedValues.length > 0) historyByCountry[row.country] = normalizedValues;
  });

  const latestByCountry = {};
  Object.entries(historyByCountry).forEach(([country, values]) => {
    const latest = values[values.length - 1];
    if (typeof latest === "number" && Number.isFinite(latest)) latestByCountry[country] = latest;
  });

  return {
    provider,
    provider_key: providerKey,
    source: "tradingview_dom",
    fetched_at: fetchedAt,
    latest_by_country: latestByCountry,
    history_by_country: historyByCountry,
    series_order: Array.isArray(seriesOrder) ? seriesOrder : [],
    metadata: {
      sourceUrl,
      countriesCount: Object.keys(historyByCountry).length,
      ...metadata,
    },
  };
};

export const scrapeInstrumentRevenueGeo = async ({
  page,
  instrument,
  provider,
  localeSubdomain,
}) => {
  const mapped = mapToTradingViewSymbolPath({
    exchange: instrument.exchange,
    providerKey: instrument.provider_key,
    symbol: instrument.symbol,
  });

  if (!mapped.ok) {
    return { status: "SKIPPED", message: mapped.reason, countriesCount: 0, payload: null };
  }

  const sourceUrl = `https://${localeSubdomain}.tradingview.com/symbols/${mapped.symbolPath}/financials-revenue/`;

  await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await ensureCountrySectionRendered(page);

  const extracted = await extractCountryRows(page);
  if (!extracted.ok) {
    return {
      status: "FAILED",
      message: String(extracted.reason ?? "EXTRACTION_FAILED"),
      countriesCount: 0,
      payload: null,
      sourceUrl,
    };
  }

  const payload = toSnapshotPayload({
    provider,
    providerKey: instrument.provider_key,
    sourceUrl,
    rows: extracted.rows,
    seriesOrder: extracted.seriesOrder,
    metadata: {
      exchange: instrument.exchange,
      tvVenue: mapped.venue,
      tvTicker: mapped.ticker,
      instrumentName: instrument.name,
    },
    fetchedAt: new Date().toISOString(),
  });

  const countriesCount = Object.keys(payload.history_by_country).length;
  return {
    status: countriesCount > 0 ? "SUCCESS" : "FAILED",
    message: countriesCount > 0 ? "OK" : "NO_NUMERIC_COUNTRY_VALUES",
    countriesCount,
    payload,
    sourceUrl,
  };
};
