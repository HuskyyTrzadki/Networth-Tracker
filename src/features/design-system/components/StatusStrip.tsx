import { cn } from "@/lib/cn";

type StatusStripTone = "neutral" | "warning" | "positive" | "negative";

type Props = Readonly<{
  label: string;
  tone?: StatusStripTone;
  hint?: string;
  className?: string;
}>;

const toneClassMap: Record<StatusStripTone, string> = {
  neutral:
    "border-dashed border-border/70 bg-background/70 text-muted-foreground",
  warning:
    "border-dashed border-[color:var(--chart-3)]/45 bg-[color:var(--chart-3)]/10 text-[color:var(--chart-3)]",
  positive:
    "border-dashed border-[color:var(--profit)]/40 bg-[color:var(--profit)]/10 text-[color:var(--profit)]",
  negative:
    "border-dashed border-[color:var(--loss)]/40 bg-[color:var(--loss)]/10 text-[color:var(--loss)]",
};

export function StatusStrip({
  label,
  tone = "neutral",
  hint,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        toneClassMap[tone],
        className
      )}
      title={hint}
    >
      {label}
    </span>
  );
}
