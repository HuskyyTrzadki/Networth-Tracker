"use client";

import { cn } from "@/lib/cn";

type Props = Readonly<{
  className?: string;
}>;

type SkeletonLineProps = Readonly<{
  className: string;
}>;

function SkeletonLine({ className }: SkeletonLineProps) {
  return <div className={cn("animate-pulse rounded-sm bg-foreground/10", className)} />;
}

export function PortfolioDashboardSkeleton({ className }: Props) {
  return (
    <div
      className={cn("space-y-5", className)}
      data-testid="portfolio-dashboard-skeleton"
    >
      <div className="hidden md:block">
        <div className="inline-flex rounded-lg border border-dashed border-border/70 bg-card/92 px-3 py-2.5 shadow-[var(--surface-shadow)]">
          <div className="flex items-center gap-2.5">
            <SkeletonLine className="h-3 w-14" />
            <SkeletonLine className="h-6 w-28 rounded-md" />
            <SkeletonLine className="h-6 w-28 rounded-md" />
          </div>
        </div>
      </div>

      <section className="min-h-[560px] rounded-lg border border-border/75 bg-card/94 shadow-[var(--surface-shadow)]">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <SkeletonLine className="h-4 w-44" />
              <SkeletonLine className="h-3 w-52" />
            </div>
            <SkeletonLine className="h-8 w-36 rounded-md" />
          </div>

          <div className="rounded-md border border-dashed border-border/70 bg-background/68 p-3">
            <div className="flex flex-wrap gap-2 border-b border-dashed border-border/70 pb-3">
              <SkeletonLine className="h-7 w-28 rounded-md" />
              <SkeletonLine className="h-7 w-24 rounded-md" />
              <SkeletonLine className="h-7 w-24 rounded-md" />
            </div>
            <div className="mt-3 rounded-md border border-dashed border-border/65 bg-card/88 p-3">
              <div className="h-[332px] rounded-md bg-foreground/[0.07]" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SkeletonLine className="h-7 w-24 rounded-md" />
              <SkeletonLine className="h-7 w-24 rounded-md" />
              <SkeletonLine className="h-7 w-24 rounded-md" />
              <SkeletonLine className="h-7 w-24 rounded-md" />
            </div>
          </div>
          <div className="flex justify-end">
            <SkeletonLine className="h-8 w-44 rounded-md" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border/75 bg-card/94 shadow-[var(--surface-shadow)]">
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <SkeletonLine className="h-4 w-40" />
              <SkeletonLine className="h-3 w-48" />
            </div>
            <SkeletonLine className="h-8 w-36 rounded-md" />
          </div>

          <div className="space-y-4 rounded-md border border-dashed border-border/70 bg-background/68 p-3">
            <div className="relative grid h-[300px] place-items-center rounded-md border border-dashed border-border/65 bg-card/88">
              <div className="size-52 rounded-full border border-border/60 bg-background/50" />
              <SkeletonLine className="absolute h-10 w-36 rounded-md" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-md border border-dashed border-border/70 bg-card/92 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-foreground/20" />
                      <SkeletonLine className="h-3 w-24" />
                    </div>
                    <SkeletonLine className="h-3 w-12" />
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-foreground/10" />
                  <div className="mt-2 flex justify-end">
                    <SkeletonLine className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
