import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { AnimatedReveal } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { cardVariants } from "@/features/design-system/components/ui/card";
import { StockSearchBar } from "@/features/stocks/components/StockSearchBar";
import { createClient } from "@/lib/supabase/server";

import StocksScreenerSection from "./StocksScreenerSection";

export const metadata: Metadata = {
  title: "Akcje",
};

function ScreenerFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className={`${cardVariants()} h-52 animate-pulse`}
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
      <main className={`mx-auto w-full px-6 py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}>
        <h1 className="text-2xl font-semibold tracking-tight">Akcje</h1>
        <div
          className={`mt-6 px-6 py-6 text-sm text-muted-foreground ${cardVariants()}`}
        >
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
    <main
      className={`mx-auto flex min-h-[calc(100vh-120px)] w-full flex-col px-5 py-6 sm:px-6 sm:py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}
    >
      <AnimatedReveal>
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/85">
            Screener
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Akcje</h1>
          <p className="text-sm text-muted-foreground">
            Twoje akcje z wszystkich portfeli w jednym miejscu.
          </p>
        </header>
      </AnimatedReveal>
      <AnimatedReveal className="mt-6" delay={0.05}>
        <Suspense fallback={<ScreenerFallback />}>
          <StocksScreenerSection />
        </Suspense>
      </AnimatedReveal>
      <AnimatedReveal className="mt-8" delay={0.1}>
        <div className="max-w-xl space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Szukasz czegoś innego?
          </p>
          <StockSearchBar />
        </div>
      </AnimatedReveal>
    </main>
  );
}
