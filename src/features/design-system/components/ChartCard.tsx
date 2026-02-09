import { cn } from "@/lib/cn";

type Props = Readonly<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}>;

export function ChartCard({ title, subtitle, right, children, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-lg border border-black/5 bg-card shadow-sm transition-shadow hover:shadow-md dark:border-white/10",
        className
      )}
    >
      <div className="space-y-4 p-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
        <div>{children}</div>
      </div>
    </section>
  );
}
