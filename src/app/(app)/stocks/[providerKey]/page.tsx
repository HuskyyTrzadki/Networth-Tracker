import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { ArrowLeft } from "lucide-react";

import { AnimatedReveal } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { createClient } from "@/lib/supabase/server";

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
}>;

export default async function StockDetailsPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return (
      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Szczegóły akcji</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby zobaczyć szczegóły.
        </div>
      </main>
    );
  }

  const resolvedParams = await params;
  const providerKey = decodeURIComponent(resolvedParams.providerKey).trim();

  const { data: instrument } = await supabase
    .from("instruments")
    .select("symbol,name,logo_url,currency")
    .eq("provider", "yahoo")
    .eq("provider_key", providerKey)
    .limit(1)
    .maybeSingle();

  const stock = (instrument as InstrumentRow | null) ?? null;
  const symbol = stock?.symbol ?? providerKey;
  const name = stock?.name ?? "Spółka";
  const logoUrl = stock?.logo_url ?? null;
  const metricCurrency = stock?.currency ?? "USD";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] flex-col px-5 py-6 sm:px-6 sm:py-8">
      <AnimatedReveal>
        <header className="space-y-4">
          <Button asChild variant="ghost" className="w-fit gap-2 px-2">
            <Link href="/stocks">
              <ArrowLeft className="size-4" />
              Powrót do akcji
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <InstrumentLogoImage src={logoUrl} size={40} fallbackText={symbol} alt={name} />
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold tracking-wide text-muted-foreground">
                {symbol}
              </p>
              <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
            </div>
          </div>
        </header>
      </AnimatedReveal>

      <AnimatedReveal className="mt-6" delay={0.05}>
        <Suspense
          fallback={<div className="h-[420px] animate-pulse rounded-2xl border border-border/70 bg-card" />}
        >
          <StockChartSection providerKey={providerKey} />
        </Suspense>
      </AnimatedReveal>

      <AnimatedReveal className="mt-6" delay={0.1}>
        <Suspense
          fallback={<div className="h-[320px] animate-pulse rounded-2xl border border-border/70 bg-card" />}
        >
          <StockMetricsSection providerKey={providerKey} metricCurrency={metricCurrency} />
        </Suspense>
      </AnimatedReveal>
    </main>
  );
}
