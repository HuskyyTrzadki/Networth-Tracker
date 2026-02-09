"use client";

import { cn } from "@/lib/cn";

type Props = Readonly<{
  className?: string;
}>;

export function PortfolioDashboardSkeleton({ className }: Props) {
  return (
    <div
      className={cn("space-y-6", className)}
      data-testid="portfolio-dashboard-skeleton"
    >
      <div className="hidden md:block">
        <div className="h-[54px] w-[300px] rounded-lg border border-black/5 bg-card p-2 shadow-sm dark:border-white/10">
          <div className="h-full w-[260px] rounded-md bg-muted/40" />
        </div>
      </div>
      <section className="min-h-[560px] rounded-lg border border-black/5 bg-card p-4 shadow-sm dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-md bg-muted/50" />
            <div className="h-3 w-48 rounded-md bg-muted/40" />
          </div>
          <div className="h-9 w-36 rounded-md bg-muted/40" />
        </div>
        <div className="mt-4 space-y-4">
          <div className="h-10 w-full max-w-[360px] rounded-md bg-muted/40" />
          <div className="h-[360px] rounded-md bg-muted/40" />
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-24 rounded-md bg-muted/40" />
            <div className="h-8 w-24 rounded-md bg-muted/40" />
            <div className="h-8 w-24 rounded-md bg-muted/40" />
            <div className="h-8 w-24 rounded-md bg-muted/40" />
          </div>
          <div className="h-9 w-44 rounded-md bg-muted/40" />
        </div>
      </section>

      <section className="rounded-lg border border-black/5 bg-card p-4 shadow-sm dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-36 rounded-md bg-muted/50" />
            <div className="h-3 w-40 rounded-md bg-muted/40" />
          </div>
          <div className="h-9 w-36 rounded-md bg-muted/40" />
        </div>

        <div className="mt-5 space-y-5">
          <div className="rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="relative grid h-[300px] place-items-center rounded-md bg-muted/30">
              <div className="size-52 rounded-full border border-muted/40" />
              <div className="absolute h-11 w-36 rounded-md bg-muted/50" />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-md border border-border/70 bg-card p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-muted/50" />
                    <div className="h-3 w-24 rounded-md bg-muted/50" />
                  </div>
                  <div className="h-3 w-12 rounded-md bg-muted/40" />
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted/40" />
                <div className="mt-2 flex justify-end">
                  <div className="h-2.5 w-16 rounded-md bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

