import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChevronRight } from "lucide-react";

import { getStockValuationSummaryCached } from "@/features/stocks";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";

import StockChartSection from "./StockChartSection";
import StockMetricsSection from "./StockMetricsSection";

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

type FactRowProps = Readonly<{
  label: string;
  value: string;
}>;

type SummaryMetricCardProps = Readonly<{
  label: string;
  value: string;
}>;

type MarginRowProps = Readonly<{
  label: string;
  helper: string;
  value: number | null;
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

const toBarPercent = (value: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(value * 100, 100));
};

const decodeProviderKey = (rawProviderKey: string): string | null => {
  try {
    const decoded = decodeURIComponent(rawProviderKey).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
};

const getPublicInstrumentCached = async (
  providerKey: string
): Promise<InstrumentRow | null> => {
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

const getStockSummaryCached = async (providerKey: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:summary`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockValuationSummaryCached(supabase, providerKey);
};

function FactRow({ label, value }: FactRowProps) {
  return (
    <div className="news-divider-row-b flex items-center justify-between pb-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function SummaryMetricCard({ label, value }: SummaryMetricCardProps) {
  return (
    <div className="news-divider-row-b grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-2 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

function MarginRow({ label, helper, value }: MarginRowProps) {
  const width = toBarPercent(value);

  return (
    <article className="news-divider-row-b space-y-2 py-2.5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold tracking-tight">{label}</h4>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <p className="text-sm font-semibold">{formatPercent(value)}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-sm border border-border/75 bg-muted/40">
        <div
          className="h-full bg-profit/90 transition-[width] duration-200 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </article>
  );
}

const buildQuickSummary = (name: string) =>
  `${name} pokazuje stabilny profil operacyjny i czytelny zestaw danych fundamentalnych.`;

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
    getStockSummaryCached(providerKey),
  ]);
  const symbol = stock?.symbol ?? providerKey;
  const name = stock?.name ?? "Spolka";
  const logoUrl = stock?.logo_url ?? null;
  const metricCurrency = stock?.currency ?? "USD";
  const exchange = stock?.exchange ?? "-";
  const region = stock?.region ?? "-";
  const summaryText = buildQuickSummary(name);

  return (
    <main className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(355px,14%)_20fr_18fr]">
      <aside className="news-divider-strong-r-xl flex min-w-0 flex-col gap-3 xl:pr-3 xl:pt-2">
        <section className="news-divider-strong-b pb-4">
          <div className="flex items-center gap-3">
            <InstrumentLogoImage src={logoUrl} size={46} fallbackText={symbol} alt={name} />
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-semibold tracking-tight">{symbol}</h1>
              <p className="truncate text-sm text-muted-foreground">{name}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/portfolio"
              className="inline-flex h-9 items-center rounded-md border border-border/85 px-3 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-muted/35"
            >
              Portfolio management
            </Link>
            <Link
              href="/stocks"
              className="inline-flex h-9 items-center rounded-md border border-border/85 px-3 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-muted/35"
            >
              Skaner
            </Link>
          </div>
        </section>

        <section className="news-divider-strong-b pb-4">
          <h2 className="text-base font-semibold tracking-tight">Fakty podstawowe</h2>
          <dl className="mt-4 space-y-2">
            <FactRow label="Gielda" value={exchange} />
            <FactRow label="Region" value={region} />
            <FactRow label="Waluta" value={metricCurrency} />
            <FactRow
              label="Kapitalizacja"
              value={formatMoneyCompact(summary.marketCap, metricCurrency)}
            />
            <FactRow label="PE (TTM)" value={formatRatio(summary.peTtm)} />
            <FactRow label="Stopa dywidendy" value={formatPercent(summary.dividendYield)} />
            <FactRow label="Aktualizacja" value={formatDate(summary.asOf?.slice(0, 10) ?? null)} />
          </dl>
        </section>
      </aside>

      <section className="news-divider-strong-r-xl flex min-w-0 flex-col gap-3 xl:pr-3 xl:pt-2">
        <section className="news-divider-strong-b pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            1. Snapshot
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Zacznij tutaj</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{summaryText}</p>
          <ul className="news-divider-strong-t mt-3 space-y-2 pt-3 text-sm text-muted-foreground">
            <li>Co jest mocne: marze i profil gotowkowy.</li>
            <li>Co jest ryzykiem: tempo zysku wobec obecnej wyceny.</li>
            <li>Co zmienilo sie ostatnio: dynamika przychodow i zysku rok do roku.</li>
          </ul>
          <p className="news-divider-strong-t mt-3 pt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Co to znaczy dla inwestora?</span>{" "}
            Najpierw sprawdz trend ceny, potem porownaj go z fundamentami.
          </p>
          <Link
            href="#sekcja-wykres"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-muted-foreground"
          >
            Przejdz do sekcji 2
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </section>

        <section id="sekcja-wykres" className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            2. Wykres i trend
          </p>
          <Suspense
            fallback={
              <div className="h-[460px] animate-pulse rounded-md border border-dashed border-border/75 bg-card/50" />
            }
          >
            <StockChartSection providerKey={providerKey} />
          </Suspense>
          <p className="news-divider-strong-t pt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Co to znaczy dla inwestora?</span>{" "}
            Szukaj momentow, w ktorych cena odrywa sie od trendu fundamentow.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            3. Fundamenty
          </p>
          <Suspense
            fallback={
              <div className="h-[380px] animate-pulse rounded-md border border-dashed border-border/75 bg-card/50" />
            }
          >
            <StockMetricsSection providerKey={providerKey} metricCurrency={metricCurrency} />
          </Suspense>
          <p className="news-divider-strong-t pt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Co to znaczy dla inwestora?</span>{" "}
            Jesli fundamenty sa stabilne, latwiej odfiltrowac krotkoterminowy szum.
          </p>
        </section>
      </section>

      <aside className="flex min-w-0 flex-col gap-3 xl:pt-2">
        <section className="news-divider-strong-b pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            4. Jak firma zarabia
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Jak firma zarabia</h2>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {summaryText}
          </p>

          <div className="mt-4 space-y-2">
            <SummaryMetricCard
              label="Kapitalizacja"
              value={formatMoneyCompact(summary.marketCap, metricCurrency)}
            />
            <SummaryMetricCard
              label="Gotowka"
              value={formatMoneyCompact(summary.cash, metricCurrency)}
            />
            <SummaryMetricCard
              label="Przychody YoY"
              value={formatPercent(summary.quarterlyRevenueYoy)}
            />
            <SummaryMetricCard
              label="Zysk YoY"
              value={formatPercent(summary.quarterlyEarningsYoy)}
            />
          </div>
          <p className="news-divider-strong-t mt-3 pt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Co to znaczy dla inwestora?</span>{" "}
            Szukaj trendu, a nie pojedynczego dobrego kwartalu.
          </p>
        </section>

        <section className="news-divider-strong-b pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            5. Ryzyka i wnioski
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Sciezka marzy</h3>
          <div className="mt-3 space-y-2">
            <MarginRow
              label="Marza operacyjna"
              helper="Po kosztach operacyjnych"
              value={summary.operatingMargin}
            />
            <MarginRow
              label="Marza netto"
              helper="Po wszystkich kosztach i podatkach"
              value={summary.profitMargin}
            />
            <MarginRow
              label="Payout ratio"
              helper="Jaka czesc zysku idzie na dywidende"
              value={summary.payoutRatio}
            />
          </div>
          <ul className="news-divider-strong-t mt-3 space-y-2 pt-3 text-sm leading-6 text-muted-foreground">
            <li>Spolka utrzymuje przewidywalny profil marz na tle sektora.</li>
            <li>Kluczowe ryzyko to tempo wzrostu zysku vs wycena rynkowa.</li>
            <li>Najpierw ocen trend, potem punkt wejscia na wykresie.</li>
          </ul>
          <p className="news-divider-strong-t mt-3 pt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Co to znaczy dla inwestora?</span>{" "}
            Tutaj podejmujesz decyzje: obserwacja, wejscie lub redukcja pozycji.
          </p>
        </section>

        <details className="news-divider-strong-b pb-4">
          <summary className="cursor-pointer text-sm font-semibold tracking-tight">
            Pokaz wiecej (dane dodatkowe)
          </summary>
          <div className="news-divider-strong-t mt-3 space-y-2 pt-3 text-sm text-muted-foreground">
            <p>Data wyplaty dywidendy: {formatDate(summary.payoutDate)}</p>
            <p>Wskaznik wyplaty: {formatPercent(summary.payoutRatio)}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-muted-foreground"
            >
              Zaloguj i odblokuj znaczniki BUY/SELL
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </details>
      </aside>
    </main>
  );
}
