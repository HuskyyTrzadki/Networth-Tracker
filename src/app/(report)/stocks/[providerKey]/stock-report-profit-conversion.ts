import type { StockProfitConversionSnapshot } from "@/features/stocks/server/get-public-stock-profit-conversion-cached";

const compactNumberFormatter = new Intl.NumberFormat("pl-PL", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

export const PROFIT_CONVERSION_EMPTY_STATE =
  "Brak kwartalnego rozkladu kosztow i zysku dla tej spolki.";

export type ProfitConversionMetricCard = Readonly<{
  label: string;
  value: string;
  caption?: string;
}>;

export type ProfitConversionSlice = Readonly<{
  key: string;
  label: string;
  valuePercent: number;
  color: string;
  help: string;
}>;

export type ProfitConversionViewModel = Readonly<{
  periodLabel: string;
  quickSummary: string;
  metrics: readonly ProfitConversionMetricCard[];
  slices: readonly ProfitConversionSlice[];
  grossMarginPercent: number;
  operatingMarginPercent: number;
  netMarginPercent: number;
  operatingDropPercent: number;
  netDropPercent: number;
  explanation: string;
  implication: string;
  sankeyCostSlices: readonly Readonly<{
    id: string;
    label: string;
    valuePercent: number;
    description: string;
  }>[];
  netProfitDescription: string;
}>;

const formatCompactValue = (value: number) =>
  compactNumberFormatter.format(value).replace(/\s/g, "");

const formatQuarterLabel = (periodEndDate: string) => {
  const date = new Date(`${periodEndDate}T00:00:00.000Z`);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${quarter} ${date.getUTCFullYear()}`;
};

const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;

const buildQuickSummary = (snapshot: StockProfitConversionSnapshot) => {
  if (snapshot.netMarginPercent >= 25) {
    return `Na czysto zostaje ok. ${formatPercent(snapshot.netMarginPercent)} przychodu, wiec model dalej konwertuje skale na mocny wynik netto.`;
  }

  if (snapshot.operatingMarginPercent >= 18) {
    return `Biznes nadal broni zdrowej marzy operacyjnej, ale wiecej przychodu znika zanim dojdziemy do zysku netto.`;
  }

  return `W tym kwartale konwersja przychodu na zysk jest bardziej napieta, wiec trzeba pilnowac gdzie znika marza.`;
};

const buildImplication = (snapshot: StockProfitConversionSnapshot) => {
  const dominantCost = [
    {
      key: "cogs",
      value: snapshot.costOfRevenuePercent,
      text: "Najwiekszy ciezar siedzi w koszcie dostarczenia produktu lub uslugi, wiec kluczowa jest obrona marzy brutto.",
    },
    {
      key: "opex",
      value: snapshot.operatingExpensePercent,
      text: "Najwiekszy ciezar siedzi w kosztach operacyjnych, wiec inwestor powinien patrzec czy wydatki na rozwoj i administracje wracaja w wyzszej monetyzacji.",
    },
    {
      key: "taxes",
      value: snapshot.taxesAndOtherPercent,
      text: "Wyrazny kawalek marzy znika ponizej poziomu operacyjnego, wiec warto pilnowac podatkow i pozycji finansowych.",
    },
  ].sort((left, right) => right.value - left.value)[0];

  return dominantCost?.text ?? "Najwazniejsze jest to, ile z przychodu zostaje po calej drabince kosztow.";
};

export function buildProfitConversionViewModel(
  snapshot: StockProfitConversionSnapshot | null
): ProfitConversionViewModel | null {
  if (!snapshot) {
    return null;
  }

  const periodLabel = formatQuarterLabel(snapshot.periodEndDate);
  const operatingDropPercent =
    snapshot.grossMarginPercent - snapshot.operatingMarginPercent;
  const netDropPercent =
    snapshot.operatingMarginPercent - snapshot.netMarginPercent;

  return {
    periodLabel,
    quickSummary: buildQuickSummary(snapshot),
    metrics: [
      {
        label: "Przychody (waluta spolki)",
        value: formatCompactValue(snapshot.revenue),
        caption: periodLabel,
      },
      {
        label: "Marza brutto",
        value: formatPercent(snapshot.grossMarginPercent),
      },
      {
        label: "Marza operacyjna",
        value: formatPercent(snapshot.operatingMarginPercent),
      },
      {
        label: "Marza netto",
        value: formatPercent(snapshot.netMarginPercent),
      },
    ],
    slices: [
      {
        key: "COGS",
        label: "Na dostarczenie uslugi",
        valuePercent: snapshot.costOfRevenuePercent,
        color: "#8d5c54",
        help: "Bezposredni koszt dostarczenia produktu lub uslugi klientowi. Przyklady: serwery i infrastruktura potrzebna do obslugi chmury, licencje/content, prowizje od platnosci, logistyka albo koszty supportu zwiazane z sama oferta.",
      },
      {
        key: "OPEX",
        label: "Na rozwoj i utrzymanie firmy",
        valuePercent: snapshot.operatingExpensePercent,
        color: "#7b756d",
        help: "Koszty prowadzenia i rozwijania calej firmy, a nie pojedynczej sprzedanej uslugi. Przyklady: R&D, marketing, sprzedaz, administracja, zarzad, biura i zaplecze organizacyjne.",
      },
      {
        key: "TAXES_OTHER",
        label: "Na podatki i inne",
        valuePercent: snapshot.taxesAndOtherPercent,
        color: "#9a8b78",
        help: "Wszystko, co znika ponizej zysku operacyjnego: podatki oraz wynik pozostalych pozycji finansowych.",
      },
      {
        key: "NET",
        label: "Zostaje jako zysk",
        valuePercent: snapshot.netMarginPercent,
        color: "#4f7a63",
        help: "Czesc przychodu, ktora zostaje akcjonariuszom po przejsciu przez cala drabinke kosztow.",
      },
    ],
    grossMarginPercent: snapshot.grossMarginPercent,
    operatingMarginPercent: snapshot.operatingMarginPercent,
    netMarginPercent: snapshot.netMarginPercent,
    operatingDropPercent,
    netDropPercent,
    explanation: `Po kosztach dostarczenia zostaje ${formatPercent(snapshot.grossMarginPercent)} marzy brutto; po kosztach operacyjnych ${formatPercent(snapshot.operatingMarginPercent)}; finalnie ${formatPercent(snapshot.netMarginPercent)} zysku netto.`,
    implication: buildImplication(snapshot),
    sankeyCostSlices: [
      {
        id: "COGS",
        label: "Dostarczenie uslugi",
        valuePercent: snapshot.costOfRevenuePercent,
        description:
          "Bezposredni koszt dostarczenia produktu lub uslugi. Przyklady: infrastruktura potrzebna do obslugi oferty, licencje/content, prowizje od platnosci, logistyka.",
      },
      {
        id: "OPEX",
        label: "Rozwoj i utrzymanie firmy",
        valuePercent: snapshot.operatingExpensePercent,
        description:
          "Koszty utrzymania i rozwoju calej firmy. Przyklady: wyplaty, R&D, marketing, sprzedaz, administracja, zarzad i ogolne zaplecze organizacyjne.",
      },
      {
        id: "TAXES_OTHER",
        label: "Podatki i inne",
        valuePercent: snapshot.taxesAndOtherPercent,
        description:
          "Pozycje ponizej zysku operacyjnego: podatki oraz pozostale efekty finansowe.",
      },
    ].filter((slice) => slice.valuePercent > 0),
    netProfitDescription:
      "Czesc przychodu, ktora zostaje po kosztach dostarczenia, kosztach operacyjnych oraz pozycjach ponizej wyniku operacyjnego.",
  };
}
