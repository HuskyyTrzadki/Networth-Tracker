import type { RevenueRow } from "./stock-report-revenue-mix-helpers";

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
    q1: { value: "$22.6B", trend: "up" },
    q2: { value: "$24.3B", trend: "up" },
    q3: { value: "$26.9B", trend: "up" },
    q4: { value: "$30.2B", trend: "up" },
  },
  {
    name: "Reality Labs",
    iconLabel: "RL",
    q1: { value: "$21.8B", trend: "up" },
    q2: { value: "$23.7B", trend: "up" },
    q3: { value: "$26.1B", trend: "up" },
    q4: { value: "$29.8B", trend: "up" },
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
    title: "1. Wynik kwartalu",
    items: [
      "Przychody i liczba reklam dalej rosna, wiec core biznes wciaz dowozi skale.",
      "Gotowka pozostaje wysoka, a FCF nadal daje spory margines bezpieczenstwa.",
      "Cena reklamy tez idzie w gore, co pokazuje, ze popyt nie opiera sie tylko na wolumenie.",
    ],
  },
  {
    title: "2. Priorytety zarzadu",
    items: [
      "AI i narzedzia reklamowe dalej sa centrum historii inwestycyjnej.",
      "Reality Labs zostaje opcja na przyszlosc, ale nadal nie jest filarem wyniku.",
      "Najwiekszy wydatek idzie w infrastrukture, czyli w zaklad o przyszla monetyzacje AI.",
    ],
  },
  {
    title: "3. Co dalej",
    items: [
      "Guidance sugeruje dalszy wzrost, ale przy bardzo wysokim rachunku za inwestycje.",
      "Capex i koszty operacyjne nadal beda rosnac szybciej, niz inwestor lubi widziec u dojrzalszej spolki.",
      "Teza pozostaje mocna tylko wtedy, gdy ten wydatek zacznie wracac w przychodzie i marzy.",
    ],
  },
  {
    title: "4. Co moze pojsc slabiej",
    items: [
      "Regulacje dalej wisza nad modelem reklamowym i praca na danych.",
      "Najwieksze ryzyko nie lezy w jednym kwartale, tylko w zbyt wolnym zwrocie z AI capexu.",
      "Reality Labs nadal potrafi spalac kapital szybciej, niz pokazuje wartosc biznesowa.",
    ],
  },
  {
    title: "5. Co wynika z Q&A",
    items: [
      "Zarzad brzmi pewnie co do AI, ale rynek bedzie chcial w koncu zobaczyc liczby, nie tylko narracje.",
      "Reklamy dalej finansuja prawie wszystko, wiec to tam trzeba pilnowac pierwszych pekniec.",
      "Kazdy nowy strumien przychodow poza reklamami bylby plusem, ale na razie to wciaz dodatek do core.",
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
      "Bilans nadal daje komfort: gotowka jest wysoka, a dlug nie wyglada jeszcze agresywnie.",
      "Watchpoint to kierunek lewaru, nie sam jego poziom w jednym kwartale.",
      "Najwazniejsze jest to, czy aktywa i zobowiazania rosna w tempie, ktore ma pokrycie w cash flow.",
    ],
  },
  {
    title: "Analiza przeplywow pienieznych",
    takeaways: [
      "Cash flow nadal jest mocnym argumentem za jakoscia biznesu.",
      "Najwieksza wartosc nie lezy w samym FCF, tylko w tym, czy dalej broni wysokiego capexu.",
      "Jesli gotowka zacznie slabnac szybciej niz wynik ksiegowy, rynek to szybko zobaczy.",
    ],
  },
  {
    title: "Pozycja konkurencyjna",
    takeaways: [
      "Przewaga nadal bierze sie ze skali, danych i mocnego silnika reklamowego.",
      "To juz nie jest jednak spokojny rynek, wiec przewage trzeba stale odnawiac.",
      "Dla inwestora kluczowe sa retencja reklamodawcow i to, czy AI faktycznie podnosi monetyzacje.",
    ],
  },
  {
    title: "Innowacje i badania",
    takeaways: [
      "Najwiekszy upside siedzi w AI, ale tylko wtedy, gdy zamieni sie w realny produkt i marze.",
      "Ryzyko wykonawcze jest wysokie, bo koszt pomylki rośnie razem ze skala inwestycji.",
      "Warto patrzec na adopcje produktow AI, nie tylko na liczbe zapowiedzi.",
    ],
  },
];

export const HOW_THEY_MAKE_MONEY: Readonly<Record<HowTheyMakeMoneyMode, HowTheyMakeMoneyDataset>> =
  {
    lastQuarter: {
      quickSummary:
        "Kwartal wyglada zdrowo: marza jest wysoka, a gotowka nadal daje luz inwestycyjny.",
      slices: [
        {
          key: "COGS",
          label: "COGS",
          valuePercent: 40.2,
          color: "#9a584c",
          help: "Koszt wytworzenia i dostarczenia produktu/uslugi (Cost of Goods Sold).",
        },
        {
          key: "R&D",
          label: "R&D",
          valuePercent: 16.3,
          color: "#5f6f82",
          help: "Wydatki na badania i rozwoj nowych produktow, modeli oraz infrastruktury.",
        },
        {
          key: "SG&A",
          label: "SG&A",
          valuePercent: 11.9,
          color: "#a47a43",
          help: "Koszty sprzedazy, marketingu i administracji (Selling, General & Administrative).",
        },
        {
          key: "Podatki",
          label: "Podatki",
          valuePercent: 4.1,
          color: "#7c6972",
          help: "Obciazenia podatkowe od wyniku finansowego spolki.",
        },
        {
          key: "Zysk",
          label: "Zysk",
          valuePercent: 30.3,
          color: "#4f7a63",
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
        "Najwiecej kosztu idzie w rozwoj i infrastrukture, nie w podtrzymywanie sprzedazy.",
      implication:
        "To profil spolki, ktora broni przyszlego wzrostu kosztem czesci marzy dzis.",
    },
    lastYear: {
      quickSummary:
        "Roczny obraz jest spokojniejszy: marza wyglada stabilniej niz w pojedynczym kwartale.",
      slices: [
        {
          key: "COGS",
          label: "COGS",
          valuePercent: 38.4,
          color: "#9a584c",
          help: "Koszt wytworzenia i dostarczenia produktu/uslugi (Cost of Goods Sold).",
        },
        {
          key: "R&D",
          label: "R&D",
          valuePercent: 17.1,
          color: "#5f6f82",
          help: "Wydatki na badania i rozwoj nowych produktow, modeli oraz infrastruktury.",
        },
        {
          key: "SG&A",
          label: "SG&A",
          valuePercent: 12.6,
          color: "#a47a43",
          help: "Koszty sprzedazy, marketingu i administracji (Selling, General & Administrative).",
        },
        {
          key: "Podatki",
          label: "Podatki",
          valuePercent: 4.0,
          color: "#7c6972",
          help: "Obciazenia podatkowe od wyniku finansowego spolki.",
        },
        {
          key: "Zysk",
          label: "Zysk",
          valuePercent: 27.9,
          color: "#4f7a63",
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
