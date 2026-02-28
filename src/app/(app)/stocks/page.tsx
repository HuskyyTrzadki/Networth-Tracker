import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { APP_CONTENT_MAX_WIDTH_CLASS } from "@/features/app-shell/lib/layout";
import { AnimatedReveal } from "@/features/design-system";
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
      <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
          <div className="h-8 w-40 animate-pulse rounded bg-muted/45" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted/40" />
          <div className="h-11 w-full max-w-xl animate-pulse rounded-md bg-muted/40" />
        </div>
      </section>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className={`${cardVariants()} h-52 animate-pulse`}
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
        <Suspense fallback={<ScreenerFallback />}>
          <StocksScreenerSection />
        </Suspense>
      </AnimatedReveal>
    </main>
  );
}
