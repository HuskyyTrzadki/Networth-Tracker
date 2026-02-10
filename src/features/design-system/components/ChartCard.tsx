import { cn } from "@/lib/cn";

type Props = Readonly<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  surface?: "default" | "subtle";
  className?: string;
}>;

export function ChartCard({
  title,
  subtitle,
  right,
  children,
  surface = "default",
  className,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border transition-shadow duration-200",
        surface === "default"
          ? "border-border/85 bg-card shadow-[var(--shadow)]"
          : "border-border/75 bg-card/85 shadow-none",
        "hover:shadow-md/20",
        className
      )}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-tight">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-[13px] text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
        <div>{children}</div>
      </div>
    </section>
  );
}
