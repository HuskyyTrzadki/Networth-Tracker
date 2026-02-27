import { cn } from "@/lib/cn";
import { cardVariants } from "@/features/design-system/components/ui/card";

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
        cardVariants({ surface: surface === "default" ? "default" : "subtle" }),
        "relative overflow-hidden transition-colors duration-150 hover:border-border/80",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/65 before:content-['']",
        className
      )}
    >
      <div className="p-4 sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-border/65 pb-3">
          <div className="min-w-0">
            <div className="font-sans text-[15px] font-semibold tracking-tight text-foreground">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 font-sans text-[13px] text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
        <div className="pt-4">{children}</div>
      </div>
    </section>
  );
}
