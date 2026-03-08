import { buildLogoDevTickerProxyUrl } from "@/features/common/lib/logo-dev";

import {
  isCustomAssetType,
  type CustomAssetType,
} from "./custom-asset-types";
import { isCashInstrumentLike } from "./system-currencies";

type InstrumentVisualInput = Readonly<{
  symbol?: string | null;
  ticker?: string | null;
  name?: string | null;
  provider?: string | null;
  instrumentType?: string | null;
  customAssetType?: string | CustomAssetType | null;
}>;

export type InstrumentVisual = Readonly<{
  label: string;
  logoTicker: string | null;
  logoProxyUrl: string | null;
  isCash: boolean;
  customAssetType: CustomAssetType | null;
  customGlyph: string | null;
}>;

const normalizeText = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const resolveCustomAssetType = (input: InstrumentVisualInput): CustomAssetType | null => {
  const providedType = input.customAssetType;
  if (providedType && isCustomAssetType(providedType)) {
    return providedType;
  }

  const symbol = normalizeText(input.symbol)?.toUpperCase();
  if (input.provider === "custom" || symbol === "CUSTOM") {
    return "OTHER";
  }

  return null;
};

const resolveLabel = (input: InstrumentVisualInput, customAssetType: CustomAssetType | null) => {
  const name = normalizeText(input.name);
  const symbol = normalizeText(input.symbol);
  const ticker = normalizeText(input.ticker);

  if (customAssetType && name) {
    return name;
  }

  return symbol ?? ticker ?? name ?? "—";
};

const customAssetGlyphs: Readonly<Record<CustomAssetType, string>> = {
  REAL_ESTATE: "🏠",
  CAR: "🚗",
  COMPUTER: "💻",
  TREASURY_BONDS: "🏦",
  TERM_DEPOSIT: "🏛",
  PRIVATE_LOAN: "🤝",
  OTHER: "📦",
};

export const resolveInstrumentVisual = (input: InstrumentVisualInput): InstrumentVisual => {
  const customAssetType = resolveCustomAssetType(input);
  const isCash = isCashInstrumentLike({
    instrumentType: input.instrumentType,
    provider: input.provider,
  });
  const label = resolveLabel(input, customAssetType);
  const tickerCandidate = normalizeText(input.symbol)?.includes(".")
    ? normalizeText(input.symbol)
    : normalizeText(input.ticker) ?? normalizeText(input.symbol) ?? label;
  const logoTicker = !isCash && !customAssetType ? tickerCandidate : null;

  return {
    label,
    logoTicker,
    logoProxyUrl: buildLogoDevTickerProxyUrl(logoTicker),
    isCash,
    customAssetType,
    customGlyph: customAssetType ? customAssetGlyphs[customAssetType] : null,
  };
};
