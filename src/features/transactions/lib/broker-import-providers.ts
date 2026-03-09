export const brokerImportProviderIds = ["xtb", "ibkr"] as const;

export type BrokerImportProviderId = (typeof brokerImportProviderIds)[number];

export const DEFAULT_BROKER_IMPORT_PROVIDER: BrokerImportProviderId = "xtb";

export const isBrokerImportProviderId = (
  value: string | null | undefined
): value is BrokerImportProviderId =>
  Boolean(value && brokerImportProviderIds.includes(value as BrokerImportProviderId));

export const brokerImportUiConfig: Record<
  BrokerImportProviderId,
  Readonly<{
    shortLabel: string;
    title: string;
    description: string;
    sourceLabel: string;
    startToastTitle: string;
    startToastDescription: string;
    unauthenticatedTitle: string;
    unauthenticatedDescription: string;
    unauthenticatedButtonLabel: string;
  }>
> = {
  xtb: {
    shortLabel: "XTB",
    title: "Import historii z XTB",
    description:
      "Importer czyta rozpakowane pliki Excel z sekcji Cash Operations, pokazuje podgląd, a potem zapisuje transakcje przez ten sam model co ręczne dodawanie.",
    sourceLabel: "Cash Operations",
    startToastTitle: "Import XTB uruchomiony.",
    startToastDescription: "Zapisujemy historię w tle. Portfel otworzy się od razu.",
    unauthenticatedTitle: "Import historii z XTB",
    unauthenticatedDescription: "Zaloguj się, aby zaimportować transakcje z XTB.",
    unauthenticatedButtonLabel: "Zaloguj się",
  },
  ibkr: {
    shortLabel: "IBKR",
    title: "Import historii z Interactive Brokers",
    description:
      "Ten broker przygotujemy w kolejnym kroku. Architektura importu jest już gotowa na kolejnych dostawców, ale parser IBKR nie jest jeszcze wdrożony.",
    sourceLabel: "Raport IBKR",
    startToastTitle: "Import IBKR uruchomiony.",
    startToastDescription: "Zapisujemy historię w tle. Portfel otworzy się od razu.",
    unauthenticatedTitle: "Import historii z Interactive Brokers",
    unauthenticatedDescription: "Zaloguj się, aby zaimportować transakcje z IBKR.",
    unauthenticatedButtonLabel: "Zaloguj się",
  },
};
