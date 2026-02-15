type FactRowProps = Readonly<{
  label: string;
  value: string;
}>;

type SummaryMetricRowProps = Readonly<{
  label: string;
  value: string;
}>;

type MarginRowProps = Readonly<{
  label: string;
  helper: string;
  valueLabel: string;
  barPercent: number;
}>;

export function FactRow({ label, value }: FactRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-[color:var(--report-rule)] pb-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

export function SummaryMetricRow({ label, value }: SummaryMetricRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-dashed border-[color:var(--report-rule)] pb-2 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

export function MarginRow({
  label,
  helper,
  valueLabel,
  barPercent,
}: MarginRowProps) {
  return (
    <article className="space-y-2 border-b border-dashed border-[color:var(--report-rule)] py-2.5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold tracking-tight">{label}</h4>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <p className="text-sm font-semibold">{valueLabel}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-sm border border-[color:var(--report-rule)] bg-muted/40">
        <div
          className="h-full bg-profit/90 transition-[width] duration-200 ease-out"
          style={{ width: `${barPercent}%` }}
        />
      </div>
    </article>
  );
}
