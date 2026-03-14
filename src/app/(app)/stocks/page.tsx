import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { AnimatedReveal } from "@/features/design-system/components/AnimatedReveal";
import { Button } from "@/features/design-system/components/ui/button";
import { cardVariants } from "@/features/design-system/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import StocksScreenerSection from "./StocksScreenerSection";

export const metadata: Metadata = {
  title: "Akcje",
};

function ScreenerFallback() {
  return (
    <>
      <section className="border-b border-dashed border-black/15 pb-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="h-3 w-28 animate-pulse rounded bg-muted/50" />
              <div className="h-10 w-80 animate-pulse rounded bg-muted/45" />
              <div className="h-4 w-[34rem] animate-pulse rounded bg-muted/40" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`stocks-stat-${index}`}
                  className="rounded-sm border border-border/55 bg-background/78 px-3 py-3"
                >
                  <div className="h-3 w-20 animate-pulse rounded bg-muted/45" />
                  <div className="mt-3 h-8 w-14 animate-pulse rounded bg-muted/40" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-dashed border-black/10 pt-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`stocks-range-${index}`}
                  className="h-8 w-14 animate-pulse rounded-sm bg-muted/40"
                />
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-border/60 bg-card/95 p-4 shadow-[var(--surface-shadow)]">
            <div className="space-y-3">
              <div className="h-3 w-28 animate-pulse rounded bg-muted/50" />
              <div className="h-7 w-64 animate-pulse rounded bg-muted/45" />
              <div className="h-4 w-72 animate-pulse rounded bg-muted/40" />
              <div className="h-11 w-full animate-pulse rounded-md bg-muted/40" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7 space-y-3">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
          <div className="h-8 w-72 animate-pulse rounded bg-muted/45" />
        </div>
        <div className="grid gap-5 rounded-sm border border-border/55 bg-card/96 p-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.15fr)]">
          <div className="space-y-4">
            <div className="h-4 w-40 animate-pulse rounded bg-muted/45" />
            <div className="h-10 w-64 animate-pulse rounded bg-muted/40" />
            <div className="h-16 w-full animate-pulse rounded bg-muted/35" />
          </div>
          <div className="min-h-[220px] animate-pulse rounded-sm border border-border/45 bg-muted/25" />
        </div>
      </section>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className={`${cardVariants()} h-60 animate-pulse rounded-sm`}
          />
        ))}
      </div>
    </>
  );
}

export default async function StocksPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <main className={`mx-auto w-full px-6 py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}>
        <section className="max-w-3xl space-y-5 border-b border-dashed border-black/15 pb-7">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/75">
              Pulpit monitoringu
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Akcje</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Po zalogowaniu zobaczysz akcje z portfeli i własną listę
              obserwowanych, z szybkim wejściem do raportu i podglądem ruchu.
            </p>
          </div>

          <div
            className={`rounded-sm border-border/60 px-6 py-5 text-sm text-muted-foreground ${cardVariants()}`}
          >
            Zaloguj się, aby otworzyć swój pulpit akcji i zapisać obserwowane
            spółki.
          </div>

          <Button asChild className="h-11 rounded-sm">
            <Link
              href={{
                pathname: "/login",
                query: { next: "/stocks" },
              }}
            >
              Zaloguj się
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`mx-auto flex min-h-[calc(100vh-120px)] w-full flex-col px-5 py-6 sm:px-6 sm:py-8 ${APP_CONTENT_MAX_WIDTH_CLASS}`}
    >
      <AnimatedReveal>
        <Suspense fallback={<ScreenerFallback />}>
          <StocksScreenerSection />
        </Suspense>
      </AnimatedReveal>
    </main>
  );
}
