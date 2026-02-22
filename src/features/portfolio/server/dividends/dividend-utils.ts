import { multiplyDecimals, parseDecimalString, toFixedDecimalString } from "@/lib/decimal";

import type { DividendMarket } from "@/features/portfolio/lib/dividend-inbox";

const TAX_FREE_FACTOR = "1";
const BELKA_FACTOR = "0.81";
const W8BEN_FACTOR = "0.85";

export const buildDividendEventKey = (
  providerKey: string,
  eventDate: string
) => `${providerKey.trim().toUpperCase()}_${eventDate}`;

export const classifyDividendMarket = (input: Readonly<{
  providerKey: string;
  symbol: string;
  region: string | null;
}>): DividendMarket => {
  const region = input.region?.trim().toUpperCase() ?? null;
  if (region === "PL") return "PL";
  if (region === "US") return "US";

  const normalizedSymbol = input.symbol.trim().toUpperCase();
  if (normalizedSymbol.endsWith(".WA")) {
    return "PL";
  }

  return "UNKNOWN";
};

export const computeDividendSmartDefault = (input: Readonly<{
  gross: string | null;
  market: DividendMarket;
  isTaxAdvantaged: boolean;
}>): Readonly<{
  netSuggested: string | null;
  hint: string | null;
}> => {
  if (!input.gross) {
    return { netSuggested: null, hint: null };
  }

  const gross = parseDecimalString(input.gross);
  if (!gross || gross.lte(0)) {
    return { netSuggested: null, hint: null };
  }

  if (input.market === "US") {
    const factor = parseDecimalString(W8BEN_FACTOR);
    if (!factor) return { netSuggested: null, hint: null };
    return {
      netSuggested: toFixedDecimalString(multiplyDecimals(gross, factor), 2),
      hint: "Sugerowana kwota netto (odjęto 15% podatku u źródła W-8BEN).",
    };
  }

  if (input.market === "PL" && !input.isTaxAdvantaged) {
    const factor = parseDecimalString(BELKA_FACTOR);
    if (!factor) return { netSuggested: null, hint: null };
    return {
      netSuggested: toFixedDecimalString(multiplyDecimals(gross, factor), 2),
      hint: "Sugerowana kwota netto (odjęto 19% podatku Belki).",
    };
  }

  if (input.market === "PL" && input.isTaxAdvantaged) {
    const factor = parseDecimalString(TAX_FREE_FACTOR);
    if (!factor) return { netSuggested: null, hint: null };
    return {
      netSuggested: toFixedDecimalString(multiplyDecimals(gross, factor), 2),
      hint: "Konto IKE/IKZE: brak podatku Belki.",
    };
  }

  return {
    netSuggested: toFixedDecimalString(gross, 2),
    hint: "Brak pewnej reguły podatkowej — zweryfikuj kwotę z wyciągiem brokera.",
  };
};
