"use client";

import dynamic from "next/dynamic";

import type { PortfolioAllocationDonutCard } from "../server/get-portfolio-allocation-donut-cards";
import { RenderWhenVisible } from "./components/RenderWhenVisible";

const PortfolioAllocationsByPortfolioWidget = dynamic(
  () =>
    import("./widgets/PortfolioAllocationsByPortfolioWidget").then(
      (module) => module.PortfolioAllocationsByPortfolioWidget
    ),
  {
    ssr: false,
    loading: () => <DeferredWidgetSkeleton title="Alokacja per portfel" />,
  }
);

function DeferredWidgetSkeleton({ title }: Readonly<{ title: string }>) {
  return (
    <section className="rounded-xl border border-border/75 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-48 animate-pulse rounded bg-muted/50" />
        <div className="h-20 animate-pulse rounded-md border border-dashed border-border/70 bg-background/65" />
      </div>
    </section>
  );
}

type Props = Readonly<{
  items: readonly PortfolioAllocationDonutCard[];
}>;

export function PortfolioAllocationsByPortfolioDeferredWidget({ items }: Props) {
  return (
    <RenderWhenVisible
      fallback={<DeferredWidgetSkeleton title="Alokacja per portfel" />}
      rootMargin="280px 0px"
    >
      <PortfolioAllocationsByPortfolioWidget items={items} />
    </RenderWhenVisible>
  );
}
