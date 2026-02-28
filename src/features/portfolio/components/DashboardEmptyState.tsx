import { Wallet } from "lucide-react";

import { buttonVariants } from "@/features/design-system/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/cn";

type DashboardEmptyStateAction = Readonly<{
  label: string;
  href: string;
}>;

type DashboardEmptyStateProps = Readonly<{
  title: string;
  subtitle: string;
  primaryAction: DashboardEmptyStateAction;
  secondaryAction: DashboardEmptyStateAction;
}>;

export function DashboardEmptyState({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: DashboardEmptyStateProps) {
  return (
    <section className="w-full max-w-2xl rounded-lg border border-border/80 bg-card/95 shadow-[var(--surface-shadow)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border/75 px-5 py-3 sm:px-6">
        <span className="inline-flex rounded-sm border border-dashed border-border/70 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Portfel
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Pusty
        </span>
      </header>

      <div className="px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border/70 bg-background/80 text-muted-foreground">
            <Wallet className="size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-start">
          <Link
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            href={primaryAction.href}
            scroll={false}
          >
            {primaryAction.label}
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full border-dashed sm:w-auto"
            )}
            href={secondaryAction.href}
            scroll={false}
          >
            {secondaryAction.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
