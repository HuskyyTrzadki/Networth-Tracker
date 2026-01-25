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
    <section className="w-full max-w-xl rounded-lg border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <Wallet className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            "w-full sm:w-auto"
          )}
          href={secondaryAction.href}
          scroll={false}
        >
          {secondaryAction.label}
        </Link>
      </div>
    </section>
  );
}
