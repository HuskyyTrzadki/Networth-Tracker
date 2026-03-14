import { Card, CardContent } from "@/features/design-system/components/ui/card";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}>;

const stockSignals = [
  { label: "Przychody", value: "Stabilny trend" },
  { label: "Marża", value: "Bez skoku kosztów" },
  { label: "Gotówka", value: "Miejsce na oddech" },
] as const;

const recentMoves = [
  { label: "Portfel", value: "287 400 PLN", detail: "+1,8% dzisiaj" },
  { label: "Obserwowane", value: "4 spółki na dipie", detail: "2 wymagają uwagi" },
  { label: "Transakcje", value: "Ostatni zakup w 12 s", detail: "z rozliczeniem gotówki" },
] as const;

export function PublicProductPreview({
  eyebrow,
  title,
  description,
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "border-border/75 bg-card/95 shadow-[var(--surface-shadow)]",
        className
      )}
    >
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-[var(--surface-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Raport spółki
                </p>
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                  Apple pod lupą
                </h3>
              </div>
              <span className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                AAPL
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {stockSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-xl border border-border/65 bg-card/90 px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {signal.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{signal.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-border/75 bg-muted/20 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Wycena i trend
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    +12,4%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kurs, historia i fundamenty czytasz na jednej osi.
                  </p>
                </div>
                <div className="hidden min-w-0 flex-1 items-end gap-2 sm:flex">
                  {[44, 58, 51, 66, 74, 70, 86].map((height, index) => (
                    <div
                      key={height}
                      className={cn(
                        "flex-1 rounded-t-full bg-[color:var(--chart-3)]/75",
                        index > 4 ? "bg-[color:var(--chart-4)]/75" : ""
                      )}
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            {recentMoves.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/70 bg-card/90 px-4 py-4 shadow-[var(--surface-shadow)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
