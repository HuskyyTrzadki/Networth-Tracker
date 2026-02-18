import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { getPublicStockSummaryCached } from "@/features/stocks";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

import StockReportMainContent from "./StockReportMainContent";
import StockReportSidebar from "./StockReportSidebar";

type Params = Promise<{
  providerKey: string;
}>;

type InstrumentRow = Readonly<{
  symbol: string;
  name: string;
  logo_url: string | null;
  currency: string;
  exchange: string | null;
  region: string | null;
}>;

const ratioFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 2,
});

const formatMoneyCompact = (value: number | null, currency: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatRatio = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? ratioFormatter.format(value)
    : "-";

const formatPercent = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? percentFormatter.format(value)
    : "-";

const formatDate = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const decodeProviderKey = (rawProviderKey: string): string | null => {
  try {
    const decoded = decodeURIComponent(rawProviderKey).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
};

const buildStockMetadata = (
  symbol: string,
  name: string,
  asOf: string | null
): Metadata => {
  const title = `${symbol} · ${name}`;
  const asOfLabel = asOf ? ` Aktualizacja: ${asOf}.` : "";
  const description = `Raport spółki ${name} (${symbol}) z wykresem, kluczowymi wskaźnikami i podsumowaniem fundamentalnym.${asOfLabel}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};

const getPublicInstrumentCached =
  async (providerKey: string): Promise<InstrumentRow | null> => {
    "use cache";

    cacheLife("days");
    cacheTag(`stock:${providerKey}`);
    cacheTag(`stock:${providerKey}:instrument`);

    const supabase = createPublicStocksSupabaseClient();
    const { data } = await supabase
      .from("instruments")
      .select("symbol,name,logo_url,currency,exchange,region")
      .eq("provider", "yahoo")
      .eq("provider_key", providerKey)
      .limit(1)
      .maybeSingle();

    return (data as InstrumentRow | null) ?? null;
  };



export async function generateMetadata({
  params,
}: Readonly<{
  params: Params;
}>): Promise<Metadata> {
  const resolvedParams = await params;
  const providerKey = decodeProviderKey(resolvedParams.providerKey);

  if (!providerKey) {
    return {
      title: "Spółka",
      description: "Raport szczegółowy spółki.",
    };
  }

  const [stock, summary] = await Promise.all([
    getPublicInstrumentCached(providerKey),
    getPublicStockSummaryCached(providerKey),
  ]);

  const symbol = stock?.symbol ?? providerKey;
  const name = stock?.name ?? "Spółka";
  const asOf = summary.asOf ? formatDate(summary.asOf.slice(0, 10)) : null;

  return buildStockMetadata(symbol, name, asOf);
}

export default async function StockDetailsPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const resolvedParams = await params;
  const providerKey = decodeProviderKey(resolvedParams.providerKey);

  if (!providerKey) {
    notFound();
  }

  const [stock, summary] = await Promise.all([
    getPublicInstrumentCached(providerKey),
    getPublicStockSummaryCached(providerKey),
  ]);

  const symbol = stock?.symbol ?? providerKey;
  const name = stock?.name ?? "Spolka";
  const logoUrl = stock?.logo_url ?? null;
  const metricCurrency = stock?.currency ?? "USD";

  return (
    <main
      className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 gap-5 pb-12 lg:grid-cols-[minmax(320px,23rem)_minmax(0,1fr)]"
      style={{ overflowAnchor: "none" }}
    >
      <StockReportSidebar
        symbol={symbol}
        name={name}
        logoUrl={logoUrl}
        exchange={stock?.exchange ?? "-"}
        region={stock?.region ?? "-"}
        metricCurrency={metricCurrency}
        marketCap={formatMoneyCompact(summary.marketCap, metricCurrency)}
        peTtm={formatRatio(summary.peTtm)}
        dividendYield={formatPercent(summary.dividendYield)}
        asOf={formatDate(summary.asOf?.slice(0, 10) ?? null)}
      />
      <StockReportMainContent providerKey={providerKey} metricCurrency={metricCurrency} />
    </main>
  );
}
