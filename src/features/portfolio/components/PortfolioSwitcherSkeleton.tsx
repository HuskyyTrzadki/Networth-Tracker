import { cn } from "@/lib/cn";

type Props = Readonly<{
  className?: string;
}>;

export function PortfolioSwitcherSkeleton({ className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2", className)}
    >
      <div className="h-3 w-16 animate-pulse rounded-md bg-muted/35" />
      <div className="h-9 min-w-[220px] flex-1 animate-pulse rounded-md border border-border/65 bg-background/80" />
    </div>
  );
}
