type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

type PortfolioOption = Readonly<{
  id: string;
}>;

export type PortfolioSelection = Readonly<{
  forcedPortfolioId: string | null;
  initialPortfolioId: string;
}>;

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parsePortfolioParam = (searchParams: SearchParams) => {
  const raw = getFirstParam(searchParams.portfolio)?.trim();
  if (!raw || raw === "all") return null;
  return raw;
};

export function resolvePortfolioSelection({
  searchParams,
  portfolios,
}: Readonly<{
  searchParams: SearchParams;
  portfolios: readonly PortfolioOption[];
}>): PortfolioSelection {
  // Server helper: lock selection when URL provides a valid portfolio id.
  const defaultPortfolioId = portfolios[0]?.id;
  if (!defaultPortfolioId) {
    throw new Error("Brak portfela dla użytkownika.");
  }

  const selected = parsePortfolioParam(searchParams);
  const forcedPortfolioId =
    selected && portfolios.some((portfolio) => portfolio.id === selected)
      ? selected
      : null;

  return {
    forcedPortfolioId,
    initialPortfolioId: forcedPortfolioId ?? defaultPortfolioId,
  };
}
