import { cn } from "@/lib/cn";

type Props = Readonly<{
  className?: string;
}>;

export function PortfolioDashboardSkeleton({ className }: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="hidden md:block">
        <div className="h-10 w-[260px] rounded-md bg-muted/50" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-md bg-muted/50" />
            <div className="h-8 w-48 rounded-md bg-muted/60" />
            <div className="h-3 w-40 rounded-md bg-muted/40" />
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="px-4 py-3">
            <div className="h-4 w-24 rounded-md bg-muted/50" />
          </div>
          <div className="border-t border-border">
            <div className="grid grid-cols-5 gap-3 px-4 py-2 text-xs text-muted-foreground">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-3 rounded-md bg-muted/40" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid h-14 grid-cols-5 items-center gap-3 border-t border-border px-4"
              >
                {Array.from({ length: 5 }).map((__, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="h-3 rounded-md bg-muted/40"
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
