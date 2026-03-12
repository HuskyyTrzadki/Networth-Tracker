import { JSDOM } from "jsdom";

export const COMPANIES_MARKETCAP_METRICS = [
  "revenue",
  "earnings",
  "pe_ratio",
  "ps_ratio",
];

const METRIC_CONFIG = {
  revenue: {
    path: "revenue",
    tableHeading: "Annual revenue",
  },
  earnings: {
    path: "earnings",
    tableHeading: "Annual earnings",
  },
  pe_ratio: {
    path: "pe-ratio",
    tableHeading: "PE ratio at the end of each year",
  },
  ps_ratio: {
    path: "ps-ratio",
    tableHeading: "PS ratio at the end of each year",
  },
};

const EMPTY_MARKER = /^(?:-|—|–|N\/A)$/i;
const NON_NUMERIC_MARKS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u00A0\u202F\s$€£¥,%]/g;
const UNIT_MULTIPLIER = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
const LEGAL_SUFFIXES = [
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "company",
  "co",
  "plc",
  "ltd",
  "limited",
  "sa",
  "s.a",
  "ag",
  "nv",
  "se",
  "spa",
  "holdings",
  "holding",
  "group",
];

const normalizeMoneyWords = (value) =>
  value
    .replace(/\bbillion\b/gi, "B")
    .replace(/\bmillion\b/gi, "M")
    .replace(/\btrillion\b/gi, "T")
    .replace(/\bthousand\b/gi, "K")
    .replace(/\bUSD\b/gi, "")
    .replace(/\bEUR\b/gi, "")
    .replace(/\bPLN\b/gi, "");

const stripKnownSuffixes = (value) =>
  value
    .replace(/\bS\.?\s*A\.?\b/gi, "")
    .replace(/\bN\.?\s*V\.?\b/gi, "")
    .replace(/\bP\.?\s*L\.?\s*C\.?\b/gi, "")
    .trim();

const toAsciiSlug = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const stripTrailingLegalSuffixes = (value) => {
  const parts = toAsciiSlug(stripKnownSuffixes(value)).split("-").filter(Boolean);

  while (parts.length > 1 && LEGAL_SUFFIXES.includes(parts[parts.length - 1])) {
    parts.pop();
  }

  return parts.join("-");
};

export const buildCompaniesMarketCapSlugCandidates = (instrument) => {
  const rawName = instrument.name?.trim() ?? "";
  const candidates = new Set();
  const nameSlug = toAsciiSlug(stripKnownSuffixes(rawName));
  const strippedSlug = stripTrailingLegalSuffixes(rawName);

  if (nameSlug) candidates.add(nameSlug);
  if (strippedSlug) candidates.add(strippedSlug);

  const withoutClass = rawName.replace(/\bclass\s+[a-z0-9]+\b/gi, "").trim();
  const withoutTickerTail = withoutClass.replace(/\(([^)]+)\)$/, "").trim();
  const withoutSuffixSlug = stripTrailingLegalSuffixes(withoutTickerTail);
  if (withoutSuffixSlug) candidates.add(withoutSuffixSlug);

  return [...candidates];
};

const cleanText = (value) => value.replace(/\s+/g, " ").trim();

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

export const normalizeCompaniesMarketCapMoneyValue = (rawValue) => {
  const stripped = normalizeMoneyWords(rawValue).replace(NON_NUMERIC_MARKS, "").trim();
  if (stripped.length === 0 || EMPTY_MARKER.test(stripped)) return null;

  const unitMatch = stripped.match(/[KMBT]$/i);
  const unit = unitMatch?.[0]?.toUpperCase() ?? null;
  const numericPart = unit ? stripped.slice(0, -1) : stripped;
  const numericValue = toNumber(numericPart);

  if (numericValue === null) return null;

  const multiplier = unit ? UNIT_MULTIPLIER[unit] : 1;
  return Number.isFinite(multiplier) ? numericValue * multiplier : null;
};

export const normalizeCompaniesMarketCapRatioValue = (rawValue) => {
  const stripped = rawValue.replace(NON_NUMERIC_MARKS, "").trim();
  if (stripped.length === 0 || EMPTY_MARKER.test(stripped)) return null;
  return toNumber(stripped);
};

export const normalizeCompaniesMarketCapPercentChange = (rawValue) => {
  const stripped = rawValue.replace(/%/g, "").trim();
  if (stripped.length === 0 || EMPTY_MARKER.test(stripped)) return null;
  const parsed = toNumber(stripped);
  return parsed === null ? null : parsed / 100;
};

const getMetricValueParser = (metric) =>
  metric === "revenue" || metric === "earnings"
    ? normalizeCompaniesMarketCapMoneyValue
    : normalizeCompaniesMarketCapRatioValue;

const parseYearCell = (cell) => {
  const text = cleanText(cell.textContent ?? "");
  const yearMatch = text.match(/(\d{4})/);
  if (!yearMatch) return null;

  return {
    year: Number(yearMatch[1]),
    isTtm: /\bTTM\b/i.test(text),
    periodLabel:
      cell.querySelector("[tooltip-title]")?.getAttribute("tooltip-title") ?? null,
  };
};

const parseHeadlineValue = (document, metric) => {
  const h2 = document.querySelector(".profile-container h2 strong");
  const text = cleanText(h2?.textContent ?? "");
  if (!text) {
    return { ttmValue: null, ttmLabel: null };
  }

  const valueParser = getMetricValueParser(metric);
  const highlighted = h2?.querySelector(".background-ya")?.textContent ?? "";
  const parsedValue = valueParser(highlighted || text);

  return {
    ttmValue: parsedValue,
    ttmLabel: text.replace(/:\s*[^:]+$/, ""),
  };
};

const findTableForMetric = (document, metric) => {
  const config = METRIC_CONFIG[metric];
  const heading = Array.from(document.querySelectorAll("h3")).find(
    (node) => cleanText(node.textContent ?? "") === config.tableHeading
  );

  if (!heading) {
    return null;
  }

  const table = heading.parentElement?.querySelector("table.table") ?? heading.nextElementSibling?.querySelector?.("table.table") ?? heading.nextElementSibling;
  return table instanceof document.defaultView.HTMLTableElement ? table : null;
};

export const parseCompaniesMarketCapMetricPage = ({ html, metric }) => {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const table = findTableForMetric(document, metric);

  if (!table) {
    throw new Error(`TABLE_NOT_FOUND:${metric}`);
  }

  const { ttmValue, ttmLabel } = parseHeadlineValue(document, metric);
  const valueParser = getMetricValueParser(metric);
  const annualHistory = Array.from(table.querySelectorAll("tbody tr"))
    .map((row) => {
      const cells = row.querySelectorAll("td");
      const yearInfo = cells[0] ? parseYearCell(cells[0]) : null;

      if (!yearInfo || !cells[1]) {
        return null;
      }

      return {
        year: yearInfo.year,
        value: valueParser(cleanText(cells[1].textContent ?? "")),
        changePercent: cells[2]
          ? normalizeCompaniesMarketCapPercentChange(cleanText(cells[2].textContent ?? ""))
          : null,
        isTtm: yearInfo.isTtm,
        periodLabel: yearInfo.periodLabel,
      };
    })
    .filter(Boolean);

  return {
    title: cleanText(document.title),
    h1: cleanText(document.querySelector(".profile-container h1")?.textContent ?? ""),
    ttmValue,
    ttmLabel,
    annualHistory,
  };
};

const tickerVariants = (instrument) => {
  const values = new Set();
  const providerKey = (instrument.provider_key ?? "").toUpperCase();
  const symbol = (instrument.symbol ?? "").toUpperCase();

  [providerKey, symbol].forEach((value) => {
    if (!value) return;
    values.add(value);
    if (value.endsWith(".WA")) values.add(value.slice(0, -3));
  });

  return [...values];
};

const verifySlugMatch = ({ instrument, parsedPage }) => {
  const title = parsedPage.title.toUpperCase();
  const name = (instrument.name ?? "").toUpperCase();

  if (name && title.includes(name)) {
    return true;
  }

  return tickerVariants(instrument).some((ticker) => title.includes(ticker));
};

export const fetchCompaniesMarketCapHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; PortfolioTrackerBot/1.0; +https://companiesmarketcap.com)",
      "accept-language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return response.text();
};

export const resolveCompaniesMarketCapSlug = async ({ instrument, fetchHtml = fetchCompaniesMarketCapHtml }) => {
  const candidates = buildCompaniesMarketCapSlugCandidates(instrument);

  for (const slug of candidates) {
    const sourceUrl = `https://companiesmarketcap.com/${slug}/${METRIC_CONFIG.revenue.path}/`;

    try {
      const html = await fetchHtml(sourceUrl);
      const parsedPage = parseCompaniesMarketCapMetricPage({
        html,
        metric: "revenue",
      });

      if (verifySlugMatch({ instrument, parsedPage })) {
        return {
          slug,
          sourceUrl,
          resolvedFrom: "name_slug",
          revenuePage: {
            html,
            parsedPage,
          },
        };
      }
    } catch {
      // try next candidate
    }
  }

  return null;
};

export const scrapeCompaniesMarketCapMetrics = async ({
  instrument,
  slug,
  fetchHtml = fetchCompaniesMarketCapHtml,
  preloadedRevenuePage = null,
}) => {
  const metrics = [];

  for (const metric of COMPANIES_MARKETCAP_METRICS) {
    const config = METRIC_CONFIG[metric];
    const sourceUrl = `https://companiesmarketcap.com/${slug}/${config.path}/`;
    const html =
      metric === "revenue" && preloadedRevenuePage?.html
        ? preloadedRevenuePage.html
        : await fetchHtml(sourceUrl);
    const parsedPage =
      metric === "revenue" && preloadedRevenuePage?.parsedPage
        ? preloadedRevenuePage.parsedPage
        : parseCompaniesMarketCapMetricPage({ html, metric });

    metrics.push({
      provider: "yahoo",
      provider_key: instrument.provider_key,
      metric,
      source: "companiesmarketcap_html",
      slug,
      source_url: sourceUrl,
      ttm_value: parsedPage.ttmValue,
      ttm_label: parsedPage.ttmLabel,
      annual_history: parsedPage.annualHistory,
      metadata: {
        title: parsedPage.title,
        heading: parsedPage.h1,
      },
      fetched_at: new Date().toISOString(),
    });
  }

  return metrics;
};
