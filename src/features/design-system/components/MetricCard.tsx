import { cn } from "@/lib/cn";

type Props = Readonly<{
  label: string;
  value: string;
  right?: React.ReactNode;
  className?: string;
}>;

export function MetricCard({ label, value, right, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}

