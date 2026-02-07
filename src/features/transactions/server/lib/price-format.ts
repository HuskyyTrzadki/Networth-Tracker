const PRICE_INPUT_DECIMALS = 2;

export const formatSuggestedPriceForInput = (rawValue: string): string => {
  // Backend normalizer for form defaults: keep user-facing precision readable.
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return rawValue;
  }

  return parsed.toFixed(PRICE_INPUT_DECIMALS);
};

