import { REVENUE_GEO_PROVIDER } from "./constants";

type CoverageHolding = Readonly<{
  instrumentId: string;
  provider: string;
  providerKey: string | null;
  instrumentType: string | null;
}>;

export const isRevenueGeoRequiredHolding = (holding: CoverageHolding) =>
  holding.provider === REVENUE_GEO_PROVIDER && holding.instrumentType === "EQUITY";

export const findRevenueGeoCoverageGaps = (
  holdings: readonly CoverageHolding[],
  coveredProviderKeys: ReadonlySet<string>
) =>
  holdings
    .filter(isRevenueGeoRequiredHolding)
    .map((holding) => holding.providerKey?.trim().toUpperCase() ?? "")
    .filter((providerKey) => providerKey.length > 0 && !coveredProviderKeys.has(providerKey))
    .filter((providerKey, index, all) => all.indexOf(providerKey) === index)
    .sort((left, right) => left.localeCompare(right));
