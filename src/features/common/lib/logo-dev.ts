const LOGO_DEV_TICKER_BASE_URL = "https://img.logo.dev/ticker";
const LOGO_DEV_PROXY_PATH = "/api/public/image";

const normalizeTicker = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) {
    return null;
  }

  return normalized;
};

export const buildLogoDevTickerCandidates = (ticker: string | null | undefined) => {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) {
    return [];
  }

  const candidates = [normalizedTicker];
  const dotIndex = normalizedTicker.indexOf(".");
  if (dotIndex > 0) {
    const baseTicker = normalizedTicker.slice(0, dotIndex);
    if (baseTicker && !candidates.includes(baseTicker)) {
      candidates.push(baseTicker);
    }
  }

  return candidates;
};

export const buildLogoDevTickerProxyUrl = (ticker: string | null | undefined) => {
  const normalizedTicker = buildLogoDevTickerCandidates(ticker)[0];
  if (!normalizedTicker) {
    return null;
  }

  return `${LOGO_DEV_PROXY_PATH}?ticker=${encodeURIComponent(normalizedTicker)}`;
};

export const buildLogoDevTickerRemoteUrl = (
  ticker: string | null | undefined,
  token: string | null | undefined
) => {
  const normalizedTicker = buildLogoDevTickerCandidates(ticker)[0];
  const normalizedToken = token?.trim();
  if (!normalizedTicker || !normalizedToken) {
    return null;
  }

  const url = new URL(
    `${LOGO_DEV_TICKER_BASE_URL}/${encodeURIComponent(normalizedTicker)}`
  );
  url.searchParams.set("token", normalizedToken);
  return url.toString();
};

export const buildLogoDevTickerRemoteUrls = (
  ticker: string | null | undefined,
  token: string | null | undefined
) => {
  const normalizedToken = token?.trim();
  if (!normalizedToken) {
    return [];
  }

  return buildLogoDevTickerCandidates(ticker).map((candidate) => {
    const url = new URL(`${LOGO_DEV_TICKER_BASE_URL}/${encodeURIComponent(candidate)}`);
    url.searchParams.set("token", normalizedToken);
    return url.toString();
  });
};
