export type InsightSeriesKey = "primary" | "secondary" | "tertiary";

export type InsightValueFormat =
  | "usd_billions"
  | "usd_per_share"
  | "ratio"
  | "shares_billions";

export type InsightChartLayer = "bar" | "line" | "area";

export type InsightChartPoint = Readonly<{
  period: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
}>;

export type InsightSeries = Readonly<{
  key: InsightSeriesKey;
  label: string;
  color: string;
  layer: InsightChartLayer;
  valueFormat?: InsightValueFormat;
  stackId?: "total";
}>;

export type InsightWidget = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  implication: string;
  nextFocus: string;
  valueFormat: InsightValueFormat;
  points: readonly InsightChartPoint[];
  series: readonly InsightSeries[];
}>;

const QUARTERS = [
  "Q1 2023",
  "Q2 2023",
  "Q3 2023",
  "Q4 2023",
  "Q1 2024",
  "Q2 2024",
  "Q3 2024",
  "Q4 2024",
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
] as const;

const toPoints = (
  primary: readonly number[],
  secondary?: readonly number[],
  tertiary?: readonly number[]
): readonly InsightChartPoint[] =>
  QUARTERS.map((period, index) => ({
    period,
    primary: primary[index] ?? 0,
    secondary: secondary?.[index],
    tertiary: tertiary?.[index],
  }));

export const STOCK_INSIGHTS_WIDGETS: readonly InsightWidget[] = [
  {
    id: "free-cash-flow",
    title: "Wolne przeplywy pieniezne",
    subtitle: "Wolna gotowka po inwestycjach",
    badge: "Przeplywy",
    description:
      "Wolny przeplyw pieniezny rosl niemal w kazdym kwartale, co daje wieksza elastycznosc na skup akcji, dywidendy i inwestycje.",
    implication:
      "Przy utrzymaniu trendu firma ma zapas na slabsze okresy bez podnoszenia zadluzenia.",
    nextFocus:
      "Sprawdz, czy wzrost FCF idzie w parze z marza operacyjna i tempem przychodow.",
    valueFormat: "usd_billions",
    points: toPoints([4.2, 3.9, 4.8, 5.1, 5.7, 6.3, 6.8, 7.2, 7.8, 8.4, 8.1, 8.9]),
    series: [
      {
        key: "primary",
        label: "FCF",
        color: "#c67a3c",
        layer: "bar",
      },
    ],
  },
  {
    id: "cash-debt",
    title: "Gotowka i dlug",
    subtitle: "Gotowka vs zadluzenie",
    badge: "Bilans",
    description:
      "Poduszka gotowkowa rosnie szybciej niz zadluzenie, co poprawia odpornosc na wyzsze stopy i spadek popytu.",
    implication:
      "Bilans pozostaje konserwatywny, a firma ma przestrzen na finansowanie nowych inicjatyw.",
    nextFocus:
      "Obserwuj relacje gotowki do dlugu i kierunek odsetek w kolejnych raportach.",
    valueFormat: "usd_billions",
    points: toPoints(
      [45, 46, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62],
      [13.2, 12.8, 12.5, 12.3, 11.9, 11.6, 11.2, 10.8, 10.3, 9.9, 9.4, 9.1]
    ),
    series: [
      {
        key: "primary",
        label: "Gotowka",
        color: "#5a8d60",
        layer: "bar",
      },
      {
        key: "secondary",
        label: "Dlug",
        color: "#b8756f",
        layer: "bar",
      },
    ],
  },
  {
    id: "dividends",
    title: "Dywidendy",
    subtitle: "Dywidenda na akcje",
    badge: "Kapital",
    description:
      "Polityka dywidendowa jest przewidywalna: regularny wzrost z niewielkimi odchyleniami miedzy kwartalami.",
    implication:
      "Dla inwestora dochodowego to sygnal stabilnych przeplywow i dyscypliny zarzadu.",
    nextFocus:
      "Sprawdz, czy wskaznik wyplaty nie rosnie szybciej niz zysk netto.",
    valueFormat: "usd_per_share",
    points: toPoints([0.42, 0.43, 0.44, 0.45, 0.47, 0.49, 0.5, 0.52, 0.55, 0.57, 0.59, 0.62]),
    series: [
      {
        key: "primary",
        label: "Dywidenda/akcje",
        color: "#5fb7b8",
        layer: "bar",
      },
    ],
  },
  {
    id: "shares-outstanding",
    title: "Akcje w obiegu",
    subtitle: "Liczba akcji w obiegu",
    badge: "Akcje",
    description:
      "Liczba akcji stopniowo spada, co moze wspierac wzrost EPS nawet przy umiarkowanym wzroscie zysku.",
    implication:
      "Mniejsza liczba akcji zwieksza udzial pojedynczego inwestora w przyszlych zyskach.",
    nextFocus:
      "Porownaj skale skupu akcji z tempem generowania wolnej gotowki.",
    valueFormat: "shares_billions",
    points: toPoints([2.62, 2.61, 2.6, 2.59, 2.58, 2.57, 2.56, 2.55, 2.54, 2.53, 2.52, 2.51]),
    series: [
      {
        key: "primary",
        label: "Akcje w obiegu",
        color: "#6da3ba",
        layer: "bar",
      },
    ],
  },
  {
    id: "expenses",
    title: "Koszty",
    subtitle: "Koszty operacyjne i sprzedazy",
    badge: "Efektywnosc",
    description:
      "Koszty rosna, ale ich dynamika pozostaje nizsza niz wzrost przychodow, co wspiera marze.",
    implication:
      "Kontrola kosztow to klucz, jesli przychody wejda w wolniejsza faze wzrostu.",
    nextFocus:
      "Pilnuj zmian kosztow operacyjnych wobec trendu marzy brutto.",
    valueFormat: "usd_billions",
    points: toPoints(
      [18.8, 19.1, 19.4, 19.8, 20.4, 20.9, 21.7, 22.2, 23.1, 23.8, 24.4, 25.1],
      [8.2, 8.3, 8.5, 8.6, 8.8, 9.1, 9.2, 9.4, 9.7, 9.9, 10.1, 10.4]
    ),
    series: [
      {
        key: "primary",
        label: "Koszty sprzedazy + administracja",
        color: "#89a9d0",
        layer: "bar",
        stackId: "total",
      },
      {
        key: "secondary",
        label: "Badania i rozwoj",
        color: "#4c78c2",
        layer: "bar",
        stackId: "total",
      },
    ],
  },
  {
    id: "valuation",
    title: "Wycena",
    subtitle: "Mnozniki wyceny",
    badge: "Mnozniki",
    description:
      "Wycena pozostaje podwyzszona, ale bez skrajnych odchylen. Rynek wycenia utrzymanie wzrostu zyskow.",
    implication:
      "Im wyzsze mnozniki, tym wieksza wrazliwosc kursu na jedno slabsze sprawozdanie.",
    nextFocus:
      "Obserwuj PE i EV/EBITDA razem z tempem wzrostu EPS.",
    valueFormat: "ratio",
    points: toPoints(
      [23.5, 22.1, 21.4, 22.8, 24.2, 25.7, 26.9, 26.4, 25.8, 26.2, 27.1, 26.7],
      [13.1, 12.8, 12.5, 13.2, 13.8, 14.2, 14.8, 14.6, 14.1, 14.4, 14.9, 14.7]
    ),
    series: [
      {
        key: "primary",
        label: "P/E",
        color: "#b36b79",
        layer: "area",
      },
      {
        key: "secondary",
        label: "EV/EBITDA",
        color: "#7c6ab2",
        layer: "line",
      },
    ],
  },
] as const;
