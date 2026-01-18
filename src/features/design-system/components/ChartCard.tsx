import { cn } from "@/lib/cn";

type Props = Readonly<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}>;

export function ChartCard({ title, subtitle, right, children, className }: Props) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-card shadow-sm", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

