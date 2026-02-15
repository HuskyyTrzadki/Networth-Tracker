export type TrendDirection = "up" | "down" | "flat";

export type RevenueCell = Readonly<{
  value: string;
  trend?: TrendDirection;
}>;

export type RevenueRow = Readonly<{
  name: string;
  iconLabel: string;
  q1: RevenueCell;
  q2: RevenueCell;
  q3: RevenueCell;
  q4: RevenueCell;
}>;

export type EarningsCallBlock = Readonly<{
  title: string;
  items: readonly string[];
}>;

export type PeerRow = Readonly<{
  ticker: string;
  price: string;
  marketCap: string;
}>;

export type DeepDiveBlock = Readonly<{
  title: string;
  takeaways: readonly string[];
}>;

export type HowTheyMakeMoneyMode = "lastQuarter" | "lastYear";

export type HowTheyMakeMoneySliceKey = "COGS" | "R&D" | "SG&A" | "Podatki" | "Zysk";

export type HowTheyMakeMoneySlice = Readonly<{
  key: HowTheyMakeMoneySliceKey;
  label: string;
  valuePercent: number;
  color: string;
  help: string;
}>;

export type HowTheyMakeMoneyMetric = Readonly<{
  label: string;
  value: string;
  change: string;
  changeDirection: "up" | "down" | "flat";
}>;

export type HowTheyMakeMoneyDataset = Readonly<{
  quickSummary: string;
  slices: readonly HowTheyMakeMoneySlice[];
  metrics: readonly HowTheyMakeMoneyMetric[];
  insight: string;
  implication: string;
}>;

export const REVENUE_BY_PRODUCTS: readonly RevenueRow[] = [
  {
    name: "Rodzina aplikacji",
    iconLabel: "FOA",
    q1: { value: "$41.9B", trend: "up" },
    q2: { value: "$47.2B", trend: "up" },
    q3: { value: "$50.8B", trend: "up" },
    q4: { value: "$58.9B", trend: "up" },
  },
  {
    name: "Reality Labs",
    iconLabel: "RL",
    q1: { value: "$0.41B", trend: "up" },
    q2: { value: "$0.37B", trend: "down" },
    q3: { value: "$0.47B", trend: "up" },
    q4: { value: "$0.95B", trend: "up" },
  },
];

export const REVENUE_BY_GEO: readonly RevenueRow[] = [
  {
    name: "Azja i Pacyfik",
    iconLabel: "APAC",
    q1: { value: "$11.2B", trend: "up" },
    q2: { value: "$12.9B", trend: "down" },
    q3: { value: "$14.3B", trend: "up" },
    q4: { value: "$15.4B", trend: "up" },
  },
  {
    name: "Europa",
    iconLabel: "EU",
    q1: { value: "$9.6B", trend: "up" },
    q2: { value: "$11.1B", trend: "down" },
    q3: { value: "$11.6B", trend: "up" },
    q4: { value: "$14.3B", trend: "up" },
  },
  {
    name: "Reszta swiata",
    iconLabel: "ROW",
    q1: { value: "$4.6B", trend: "up" },
    q2: { value: "$5.1B", trend: "down" },
    q3: { value: "$5.7B", trend: "up" },
    q4: { value: "$6.4B", trend: "up" },
  },
  {
    name: "USA i Kanada",
    iconLabel: "NA",
    q1: { value: "$16.9B", trend: "up" },
    q2: { value: "$18.5B", trend: "down" },
    q3: { value: "$19.7B", trend: "up" },
    q4: { value: "$23.8B", trend: "up" },
  },
];

export const EARNINGS_CALL_BLOCKS: readonly EarningsCallBlock[] = [
  {
    title: "1. Kluczowe wyniki finansowe i metryki",
    items: [
      "Przychody Q4: $58.9B (+25% r/r), glownie napedzane przez reklamy.",
      "Wolne przeplywy pieniezne: $14.1B; gotowka i papiery: $81.6B; dlug: $58.7B.",
      "Liczba wyswietlen reklam +18%, srednia cena reklamy +6% r/r.",
    ],
  },
  {
    title: "2. Aktualizacje strategiczne i najwazniejsze wydarzenia",
    items: [
      "Priorytet 2026: produkty AI i monetyzacja narzedzi reklamowych.",
      "Reality Labs: koncentracja na okularach i wearables oraz stopniowe ograniczanie strat.",
      "MetaCompute: inwestycje w infrastrukture, krzem i energie pod rozwoj AI.",
    ],
  },
  {
    title: "3. Prognoza i perspektywy",
    items: [
      "Prognoza przychodow Q1 2026: $53.5B-$56.5B.",
      "Koszty 2026: $162B-$169B; naklady inwestycyjne: $115B-$135B.",
      "Oczekiwany wyzszy wynik operacyjny mimo presji kosztowej.",
    ],
  },
  {
    title: "4. Ryzyka i obawy",
    items: [
      "Regulacje EU/US i potencjalny wplyw na reklamy oraz dane.",
      "Wysokie tempo inwestycji AI podnosi ryzyko opoznionego ROI.",
      "Reality Labs pozostaje segmentem o najwyzszej niepewnosci rentownosci.",
    ],
  },
  {
    title: "5. Najwazniejsze wnioski z Q&A",
    items: [
      "Zarzad podkresla dlugoterminowy zwrot z AI, nawet przy wysokim capex teraz.",
      "Systemy reklamowe utrzymuja silny wzrost konwersji i lepsze targetowanie.",
      "Dlugoterminowo firma chce zwiekszac udzial przychodow poza reklamami.",
    ],
  },
];

export const PEERS: readonly PeerRow[] = [
  { ticker: "GOOGL", price: "$182.31", marketCap: "$2.22T" },
  { ticker: "AMZN", price: "$193.54", marketCap: "$2.01T" },
  { ticker: "NFLX", price: "$714.22", marketCap: "$307B" },
  { ticker: "SNAP", price: "$13.48", marketCap: "$22.9B" },
  { ticker: "PINS", price: "$46.07", marketCap: "$31.2B" },
  { ticker: "RDDT", price: "$84.15", marketCap: "$14.6B" },
];

export const DEEP_DIVE_BLOCKS: readonly DeepDiveBlock[] = [
  {
    title: "Kondycja bilansu",
    takeaways: [
      "Bilans pozostaje mocny: wysoka poduszka gotowkowa i przewaga kapitalu wlasnego nad dlugiem.",
      "Wzrost zadluzenia kwartal do kwartalu jest widoczny, ale nadal miesci sie w konserwatywnym profilu ryzyka.",
      "Najwazniejsze do monitorowania: dlug do kapitalu, tempo wzrostu aktywow oraz struktura zobowiazan krotkoterminowych.",
    ],
  },
  {
    title: "Analiza przeplywow pienieznych",
    takeaways: [
      "Spolka utrzymuje dodatnie przeplywy operacyjne i wysoki wolny przeplyw pieniezny.",
      "Najwiecej wartosci daje relacja FCF do capex oraz stabilnosc marz operacyjnych.",
      "Kluczowe pytanie na kolejne kwartaly: czy FCF nadal rosl bedzie szybciej niz koszty AI infrastruktury.",
    ],
  },
  {
    title: "Pozycja konkurencyjna",
    takeaways: [
      "Przewaga konkurencyjna opiera sie na skali dystrybucji, danych i efektywnosci systemu reklamowego.",
      "Rynek pozostaje agresywny: presja od platform retail media oraz dynamicznych formatow video.",
      "Z perspektywy inwestora kluczowe sa wskazniki retencji reklamodawcow i monetyzacji nowych produktow AI.",
    ],
  },
  {
    title: "Innowacje i badania",
    takeaways: [
      "Najwiekszy potencjal wartosci jest w narzedziach AI dla reklamodawcow oraz automatyzacji tworzenia kampanii.",
      "Ryzyko wykonawcze dotyczy skali inwestycji, kosztu mocy obliczeniowej i czasu do komercjalizacji.",
      "Warto obserwowac roadmape modeli i wskazniki adopcji funkcji AI przez userow i biznes.",
    ],
  },
];

export const HOW_THEY_MAKE_MONEY: Readonly<Record<HowTheyMakeMoneyMode, HowTheyMakeMoneyDataset>> =
  {
    lastQuarter: {
      quickSummary:
        "Silny kwartal: stabilne tempo przychodow, wysoka marza operacyjna i duza elastycznosc gotowkowa.",
      slices: [
        {
          key: "COGS",
          label: "COGS",
          valuePercent: 40.2,
          color: "#dd554d",
          help: "Koszt wytworzenia i dostarczenia produktu/uslugi (Cost of Goods Sold).",
        },
        {
          key: "R&D",
          label: "R&D",
          valuePercent: 16.3,
          color: "#4d79d8",
          help: "Wydatki na badania i rozwoj nowych produktow, modeli oraz infrastruktury.",
        },
        {
          key: "SG&A",
          label: "SG&A",
          valuePercent: 11.9,
          color: "#e4a53d",
          help: "Koszty sprzedazy, marketingu i administracji (Selling, General & Administrative).",
        },
        {
          key: "Podatki",
          label: "Podatki",
          valuePercent: 4.1,
          color: "#7b5ad8",
          help: "Obciazenia podatkowe od wyniku finansowego spolki.",
        },
        {
          key: "Zysk",
          label: "Zysk",
          valuePercent: 30.3,
          color: "#5bb58a",
          help: "Czesc przychodu, ktora pozostaje po pokryciu kosztow i podatkow.",
        },
      ],
      metrics: [
        { label: "Przychody", value: "$113.9B", change: "+11%", changeDirection: "up" },
        { label: "Zysk netto", value: "$34.5B", change: "-1%", changeDirection: "down" },
        { label: "Zysk na akcje", value: "$2.85", change: "-1%", changeDirection: "down" },
        { label: "Marza netto", value: "30.3%", change: "-3.9 pkt", changeDirection: "down" },
      ],
      insight:
        "Wydatki na badania i rozwoj sa wyraznie wyzsze niz koszty sprzedazy i administracji, co wskazuje na nacisk na rozwój produktow i infrastruktury.",
      implication:
        "To profil spolki stawiajacej na dlugoterminowy wzrost, nawet kosztem wolniejszej ekspansji marzy w krotkim terminie.",
    },
    lastYear: {
      quickSummary:
        "W ukladzie rocznym struktura marz jest bardziej stabilna i mniej podatna na jednorazowe odchylenia kwartalne.",
      slices: [
        {
          key: "COGS",
          label: "COGS",
          valuePercent: 38.4,
          color: "#dd554d",
          help: "Koszt wytworzenia i dostarczenia produktu/uslugi (Cost of Goods Sold).",
        },
        {
          key: "R&D",
          label: "R&D",
          valuePercent: 17.1,
          color: "#4d79d8",
          help: "Wydatki na badania i rozwoj nowych produktow, modeli oraz infrastruktury.",
        },
        {
          key: "SG&A",
          label: "SG&A",
          valuePercent: 12.6,
          color: "#e4a53d",
          help: "Koszty sprzedazy, marketingu i administracji (Selling, General & Administrative).",
        },
        {
          key: "Podatki",
          label: "Podatki",
          valuePercent: 4.0,
          color: "#7b5ad8",
          help: "Obciazenia podatkowe od wyniku finansowego spolki.",
        },
        {
          key: "Zysk",
          label: "Zysk",
          valuePercent: 27.9,
          color: "#5bb58a",
          help: "Czesc przychodu, ktora pozostaje po pokryciu kosztow i podatkow.",
        },
      ],
      metrics: [
        { label: "Przychody", value: "$403.0B", change: "+15.1%", changeDirection: "up" },
        { label: "Zysk brutto", value: "$240.4B", change: "+18.0%", changeDirection: "up" },
        { label: "Zysk operacyjny", value: "$129.2B", change: "+14.9%", changeDirection: "up" },
        { label: "Zysk na akcje", value: "$10.91", change: "+34.2%", changeDirection: "up" },
      ],
      insight:
        "W skali roku najwieksza pozycja kosztowa to COGS, ale udzial R&D pozostaje wysoki na tle sektora.",
      implication:
        "Jesli tempo wzrostu zwolni, utrzymanie wysokiego R&D i dyscypliny kosztowej bedzie kluczowe dla przewagi konkurencyjnej.",
    },
  };
