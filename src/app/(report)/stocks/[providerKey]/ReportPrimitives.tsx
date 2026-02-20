import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/features/design-system/components/ui/card";

export function SectionHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
  as = "h2",
}: Readonly<{
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  as?: "h1" | "h2" | "h3";
}>) {
  const TitleTag = as;

  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1.5">
        <TitleTag
          className={cn(
            "font-serif text-2xl font-bold tracking-tight text-foreground",
            titleClassName
          )}
        >
          {title}
        </TitleTag>
        {description ? (
          <p className={cn("text-sm text-muted-foreground", descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function ReportCard({
  children,
  className,
  contentClassName,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}>) {
  return (
    <Card className={cn("border-black/5 bg-white", className)}>
      <CardContent className={cn("p-6", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function ReportSection({
  id,
  title,
  description,
  children,
  className,
}: Readonly<{
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <section
      id={id}
      className={cn(
        "space-y-3 border-b border-dashed border-black/15 pb-6",
        className
      )}
    >
      <SectionHeader title={title} description={description} as="h2" />
      {children}
    </section>
  );
}

export function EditorsNote({
  title,
  children,
  className,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <aside
      className={cn(
        "border-l border-dashed border-black/20 bg-amber-100/20 px-3 py-2",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-1 text-sm italic leading-relaxed text-foreground/90">{children}</div>
    </aside>
  );
}

export function ReportDataRow({
  label,
  value,
  className,
}: Readonly<{
  label: string;
  value: string;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-black/15 pb-2 text-sm",
        className
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
