type EventAnchor = Readonly<{
  ratio: number;
}>;

type ChartDataPoint = Readonly<{
  t: string;
  price: number | null;
}>;

export type StockChartEventMarker =
  | Readonly<{
      id: string;
      t: string;
      kind: "earnings";
      annotationLabel: string;
      quarterLabel: string;
      expectedRevenue: number;
      actualRevenue: number;
      expectedEps: number;
      actualEps: number;
    }>
  | Readonly<{
      id: string;
      t: string;
      kind: "news";
      annotationLabel: string;
      title: string;
      summary: string;
      imageUrl: string;
    }>
  | Readonly<{
      id: string;
      t: string;
      kind: "globalNews";
      annotationLabel: string;
      title: string;
      summary: string;
      imageUrl: string;
    }>
  | Readonly<{
      id: string;
      t: string;
      kind: "userTrade";
      side: "BUY" | "SELL";
      positionValue: number;
      quantity: number;
      executionPrice: number;
    }>;

const EARNINGS_ANCHOR: EventAnchor = { ratio: 0.72 };
const NEWS_ANCHOR: EventAnchor = { ratio: 0.36 };
const USER_TRADE_ANCHOR: EventAnchor = { ratio: 0.52 };
const GLOBAL_NEWS_ANCHOR: EventAnchor = { ratio: 0.18 };

const NEWS_TEMPLATES = [
  {
    id: "news-gemini-2-5-pro",
    annotationLabel: "Premiera produktu AI",
    title: "Premiera Gemini 2.5 Pro",
    summary:
      "Google rozszerza model Gemini 2.5 Pro i zapowiada szybsza monetyzacje narzedzi AI.",
    imageUrl: "https://picsum.photos/seed/gemini-2-5-pro/120/80",
  },
  {
    id: "news-ceo-change-cloud",
    annotationLabel: "Zmiana CEO segmentu",
    title: "Zmiana CEO w kluczowym segmencie cloud",
    summary:
      "Nowy CEO segmentu cloud zmienia priorytety sprzedazowe i harmonogram inwestycji produktowych.",
    imageUrl: "https://picsum.photos/seed/ceo-cloud-change/120/80",
  },
  {
    id: "news-cloud-ai-enterprise",
    annotationLabel: "Nowe kontrakty enterprise",
    title: "Nowe wdrozenia AI w chmurze",
    summary:
      "Nowe kontrakty enterprise wzmacniaja segment cloud i popyt na infrastrukture AI.",
    imageUrl: "https://picsum.photos/seed/cloud-ai-enterprise/120/80",
  },
] as const;

const GLOBAL_NEWS_TEMPLATES = [
  {
    id: "global-news-covid",
    annotationLabel: "Szok makro: COVID",
    title: "Wybuch COVID-19",
    summary:
      "Globalny szok popytowo-podazowy wywolal wysoka zmiennosc i silne ruchy na rynkach.",
    imageUrl: "https://picsum.photos/seed/global-covid/120/80",
  },
  {
    id: "global-news-trump-tariffs",
    annotationLabel: "Szok makro: nowe cla",
    title: "Nowe cla administracji USA",
    summary:
      "Zapowiedz nowych cel podniosla niepewnosc w handlu miedzynarodowym i marzach importerow.",
    imageUrl: "https://picsum.photos/seed/global-tariffs/120/80",
  },
  {
    id: "global-news-fed-hikes",
    annotationLabel: "Szok makro: podwyzki stop",
    title: "Cykl podwyzek stop",
    summary:
      "Zaostrzenie polityki pienieznej zwiekszylo koszty kapitalu i presje na wyceny growth.",
    imageUrl: "https://picsum.photos/seed/global-rates/120/80",
  },
] as const;

const clampIndex = (index: number, max: number) => Math.min(Math.max(index, 0), max);

const resolveAnchorTimestamp = (points: readonly ChartDataPoint[], anchor: EventAnchor) => {
  const maxIndex = points.length - 1;
  const index = clampIndex(Math.round(anchor.ratio * maxIndex), maxIndex);
  return points[index]?.t ?? null;
};

type YearlyAnchor = Readonly<{
  year: number;
  t: string;
}>;

const getYearFromTimestamp = (timestamp: string) => new Date(timestamp).getUTCFullYear();

const resolveYearlyAnchors = (
  points: readonly ChartDataPoint[],
  anchor: EventAnchor
): readonly YearlyAnchor[] => {
  const pointsByYear = new Map<number, ChartDataPoint[]>();

  points.forEach((point) => {
    if (typeof point.price !== "number" || !Number.isFinite(point.price)) {
      return;
    }

    const year = getYearFromTimestamp(point.t);
    const existing = pointsByYear.get(year);
    if (existing) {
      existing.push(point);
    } else {
      pointsByYear.set(year, [point]);
    }
  });

  return [...pointsByYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, yearPoints]) => {
      const t = resolveAnchorTimestamp(yearPoints, anchor);
      return t ? ({ year, t } satisfies YearlyAnchor) : null;
    })
    .filter((value): value is YearlyAnchor => value !== null);
};

export const buildMockChartEventMarkers = (
  points: readonly ChartDataPoint[],
  options: Readonly<{
    includeEarnings: boolean;
    includeNews: boolean;
    includeUserTrades: boolean;
    includeGlobalNews: boolean;
  }>
): readonly StockChartEventMarker[] => {
  if (points.length === 0) {
    return [];
  }

  const markers: StockChartEventMarker[] = [];
  const earningsYearAnchors = resolveYearlyAnchors(points, EARNINGS_ANCHOR);
  const newsYearAnchors = resolveYearlyAnchors(points, NEWS_ANCHOR);
  const userTradeYearAnchors = resolveYearlyAnchors(points, USER_TRADE_ANCHOR);
  const globalNewsYearAnchors = resolveYearlyAnchors(points, GLOBAL_NEWS_ANCHOR);

  if (options.includeEarnings) {
    const revenueBase = 35_000_000_000;
    const revenueStep = 1_250_000_000;
    const epsBase = 4.2;
    const epsStep = 0.34;
    const revenueBeatPattern = [0.03, -0.012, 0.022, 0.038, -0.006] as const;
    const epsBeatPattern = [0.05, -0.018, 0.029, 0.041, -0.009] as const;

    earningsYearAnchors.forEach((anchorEntry, index) => {
      const expectedRevenue = revenueBase + revenueStep * index;
      const expectedEps = epsBase + epsStep * index;
      const revenueBeat = revenueBeatPattern[index % revenueBeatPattern.length];
      const epsBeat = epsBeatPattern[index % epsBeatPattern.length];
      const actualRevenue = Math.round(expectedRevenue * (1 + revenueBeat));
      const actualEps =
        Math.round(expectedEps * (1 + epsBeat) * 100) / 100;

      markers.push({
        id: `earnings-${anchorEntry.year}`,
        t: anchorEntry.t,
        kind: "earnings",
        annotationLabel: `Wyniki ${anchorEntry.year}`,
        quarterLabel: `Q4 ${anchorEntry.year}`,
        expectedRevenue,
        actualRevenue,
        expectedEps,
        actualEps,
      });
    });
  }

  if (options.includeNews) {
    newsYearAnchors.forEach((anchorEntry, index) => {
      const template = NEWS_TEMPLATES[index % NEWS_TEMPLATES.length];
      if (!template) return;

      markers.push({
        id: `${template.id}-${anchorEntry.year}`,
        t: anchorEntry.t,
        kind: "news",
        annotationLabel: template.annotationLabel,
        title: template.title,
        summary: template.summary,
        imageUrl: template.imageUrl,
      });
    });
  }

  if (options.includeUserTrades) {
    const tradeMultipliers = [0.7, 1.1, 2.6, 1.5, 3.2, 0.95, 1.9] as const;
    const sidePattern = ["BUY", "BUY", "SELL", "BUY", "SELL"] as const;
    const basePositionValue = 120_000;
    const baseQuantity = 90;

    userTradeYearAnchors.forEach((anchorEntry, index) => {
      const side = sidePattern[index % sidePattern.length];
      const multiplier = tradeMultipliers[index % tradeMultipliers.length];
      const positionValue = Math.round(basePositionValue * multiplier);
      const quantity = Math.round(baseQuantity * (0.55 + multiplier * 0.65));
      const executionPrice =
        Math.round((positionValue / Math.max(quantity, 1)) * 100) / 100;

      markers.push({
        id: `user-trade-${anchorEntry.year}-${side.toLowerCase()}`,
        t: anchorEntry.t,
        kind: "userTrade",
        side,
        positionValue,
        quantity,
        executionPrice,
      });
    });
  }

  if (options.includeGlobalNews) {
    globalNewsYearAnchors.forEach((anchorEntry, index) => {
      const template =
        GLOBAL_NEWS_TEMPLATES[index % GLOBAL_NEWS_TEMPLATES.length];
      if (!template) return;

      markers.push({
        id: `${template.id}-${anchorEntry.year}`,
        t: anchorEntry.t,
        kind: "globalNews",
        annotationLabel: template.annotationLabel,
        title: template.title,
        summary: template.summary,
        imageUrl: template.imageUrl,
      });
    });
  }

  return markers;
};
