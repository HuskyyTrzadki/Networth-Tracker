export type EconomicCurrencyExposurePromptHolding = Readonly<{
  instrumentId: string;
  symbol: string;
  name: string;
  provider: string;
  providerKey: string;
  instrumentType: string | null;
  customAssetType: string | null;
  customAssetTypeLabel: string | null;
  quoteCurrency: string;
  revenueByCountry: Readonly<Record<string, number>>;
}>;

export const buildEconomicCurrencyExposurePrompt = (
  holdings: readonly EconomicCurrencyExposurePromptHolding[]
) => {
  const systemInstruction = [
    "You are a portfolio economic currency exposure analyzer.",
    "Return valid JSON only.",
    "For each asset, return currencyExposure with sharePct values that sum to 100.",
    "Use ISO 4217 3-letter currency codes whenever possible.",
    "For ETFs and region buckets (e.g. EIMI, Other Americas), infer realistic currency exposure.",
    "For custom assets: CAR, REAL_ESTATE, TERM_DEPOSIT, PRIVATE_LOAN default to domestic/local currency unless explicit data suggests otherwise.",
    "Do not include markdown or comments.",
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: "Infer per-asset economic currency exposure from wallet holdings.",
      outputSchema: {
        assets: [
          {
            instrumentId: "string",
            currencyExposure: [{ currencyCode: "string", sharePct: "number" }],
            rationale: "optional short string",
          },
        ],
      },
      holdings,
    },
    null,
    2
  );

  return { systemInstruction, userPrompt };
};
