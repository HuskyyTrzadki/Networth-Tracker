import { cookies } from "next/headers";
import { Suspense } from "react";
import Link from "next/link";

import { AnimatedReveal } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { StockSearchBar } from "@/features/stocks/components/StockSearchBar";
import { createClient } from "@/lib/supabase/server";

import StocksScreenerSection from "./StocksScreenerSection";

export const metadata = {
  title: "Akcje",
};

function ScreenerFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-56 animate-pulse rounded-lg border border-border/70 bg-card"
        />
      ))}
    </div>
  );
}

export default async function StocksPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className="mx-auto w-full max-w-[1560px] px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Akcje</h1>
        <div className="mt-6 rounded-lg border border-border bg-card px-6 py-6 text-sm text-muted-foreground">
          Zaloguj się, aby korzystać ze screenera akcji.
        </div>
        <Button asChild className="mt-4 h-11">
          <Link
            href={{
              pathname: "/login",
              query: { next: "/stocks" },
            }}
          >
            Zaloguj się
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1560px] flex-col px-5 py-6 sm:px-6 sm:py-8">
      <AnimatedReveal>
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
            Screener
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Akcje</h1>
          <p className="text-sm text-muted-foreground">
            Twoje akcje z wszystkich portfeli w jednym miejscu.
          </p>
          <div className="max-w-xl">
            <StockSearchBar />
          </div>
        </header>
      </AnimatedReveal>
      <AnimatedReveal className="mt-6" delay={0.05}>
        <Suspense fallback={<ScreenerFallback />}>
          <StocksScreenerSection />
        </Suspense>
      </AnimatedReveal>
    </main>
  );
}
