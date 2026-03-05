const NON_NUMERIC_MARKS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u00A0\u202F\s]/g;
const EMPTY_MARKER = /^(?:-|—|–|N\/A)$/i;
const UNIT_MULTIPLIER = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };

const BREAKDOWN_CONFIG = {
  geo: {
    titles: ["By country", "Wed\u0142ug kraju"],
    latestKey: "latest_by_country",
    historyKey: "history_by_country",
    metadataCountKey: "countriesCount",
  },
  source: {
    titles: ["By source", "Wed\u0142ug \u017ar\u00f3d\u0142a"],
    latestKey: "latest_by_source",
    historyKey: "history_by_source",
    metadataCountKey: "sourcesCount",
  },
};

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

export const normalizeTradingViewMoneyValue = (rawValue) => {
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

const getBreakdownConfig = (kind) => {
  const config = BREAKDOWN_CONFIG[kind];
  if (!config) {
    throw new Error(`UNSUPPORTED_BREAKDOWN_KIND: ${String(kind)}`);
  }
  return config;
};

const ensureBreakdownSectionRendered = async (page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    window.scrollTo(0, Math.round(document.body.scrollHeight * 0.75));
  });

  await page.waitForTimeout(900);

  try {
    const knownTitles = Object.values(BREAKDOWN_CONFIG).flatMap(
      (config) => config.titles
    );

    await page.waitForFunction(
      (titles) => {
        const text = document.body.textContent ?? "";
        return titles.some((title) => text.includes(title));
      },
      knownTitles,
      { timeout: 10000 }
    );
  } catch {
    // best effort
  }
};

const extractBreakdownRows = async (page, kind) =>
  page.evaluate(({ inputKind, configMap }) => {
    const config = configMap[inputKind];
    if (!config) {
      return { ok: false, reason: "UNSUPPORTED_BREAKDOWN_KIND", rows: [], seriesOrder: [] };
    }

    const titleNode = Array.from(document.querySelectorAll("div,span,h2,h3")).find(
      (node) => {
        const text = node.textContent?.trim();
        return text ? config.titles.includes(text) : false;
      }
    );

    if (!titleNode) {
      return { ok: false, reason: "BREAKDOWN_SECTION_NOT_FOUND", rows: [], seriesOrder: [] };
    }

    const section = titleNode.closest('div[class*="section-"]') ?? titleNode.parentElement;
    if (!section) {
      return {
        ok: false,
        reason: "BREAKDOWN_SECTION_CONTAINER_NOT_FOUND",
        rows: [],
        seriesOrder: [],
      };
    }

    const rows = Array.from(section.querySelectorAll("[data-name]"))
      .map((rowNode) => {
        const label = rowNode.getAttribute("data-name")?.trim() ?? "";
        const rawValues = Array.from(rowNode.querySelectorAll('div[class*="value-"]'))
          .map((valueNode) => valueNode.textContent?.trim() ?? "")
          .filter((text) => text.length > 0);

        return { label, rawValues };
      })
      .filter((row) => row.label.length > 0 && row.rawValues.length > 0);

    if (rows.length === 0) {
      return { ok: false, reason: "NO_BREAKDOWN_ROWS", rows: [], seriesOrder: [] };
    }

    return { ok: true, reason: null, rows, seriesOrder: [] };
  }, { inputKind: kind, configMap: BREAKDOWN_CONFIG });

const toSnapshotPayload = ({
  provider,
  providerKey,
  sourceUrl,
  rows,
  seriesOrder,
  metadata,
  fetchedAt,
  kind,
}) => {
  const config = getBreakdownConfig(kind);
  const historyByLabel = {};

  rows.forEach((row) => {
    const normalizedValues = row.rawValues
      .map((rawValue) => normalizeTradingViewMoneyValue(rawValue))
      .filter((value) => typeof value === "number");

    if (normalizedValues.length > 0) {
      historyByLabel[row.label] = normalizedValues;
    }
  });

  const latestByLabel = {};
  Object.entries(historyByLabel).forEach(([label, values]) => {
    const latest = values[values.length - 1];
    if (typeof latest === "number" && Number.isFinite(latest)) {
      latestByLabel[label] = latest;
    }
  });

  return {
    provider,
    provider_key: providerKey,
    source: "tradingview_dom",
    fetched_at: fetchedAt,
    [config.latestKey]: latestByLabel,
    [config.historyKey]: historyByLabel,
    series_order: Array.isArray(seriesOrder) ? seriesOrder : [],
    metadata: {
      sourceUrl,
      [config.metadataCountKey]: Object.keys(historyByLabel).length,
      breakdownKind: kind,
      ...metadata,
    },
  };
};

export const scrapeInstrumentRevenueBreakdown = async ({
  page,
  instrument,
  provider,
  localeSubdomain,
  kind,
}) => {
  const config = getBreakdownConfig(kind);
  const mapped = mapToTradingViewSymbolPath({
    exchange: instrument.exchange,
    providerKey: instrument.provider_key,
    symbol: instrument.symbol,
  });

  if (!mapped.ok) {
    return { status: "SKIPPED", message: mapped.reason, rowsCount: 0, payload: null };
  }

  const sourceUrl = `https://${localeSubdomain}.tradingview.com/symbols/${mapped.symbolPath}/financials-revenue/`;

  await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await ensureBreakdownSectionRendered(page);

  const extracted = await extractBreakdownRows(page, kind);
  if (!extracted.ok) {
    return {
      status: "FAILED",
      message: String(extracted.reason ?? "EXTRACTION_FAILED"),
      rowsCount: 0,
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
      instrumentName: instrument.name ?? null,
    },
    fetchedAt: new Date().toISOString(),
    kind,
  });

  const rowsCount = Object.keys(payload[config.historyKey] ?? {}).length;

  return {
    status: rowsCount > 0 ? "SUCCESS" : "FAILED",
    message: rowsCount > 0 ? "OK" : "NO_NUMERIC_BREAKDOWN_VALUES",
    rowsCount,
    payload,
    sourceUrl,
  };
};
