import { cn } from "@/lib/cn";

type Props = Readonly<{
  value: string;
  trend: "up" | "down" | "flat";
  className?: string;
}>;

export function ChangePill({ value, trend, className }: Props) {
  const trendClasses =
    trend === "up"
      ? "border-profit text-profit"
      : trend === "down"
        ? "border-loss text-loss"
        : "border-border text-muted-foreground";

  const icon = trend === "up" ? "▲" : trend === "down" ? "▼" : "•";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 font-mono text-xs tabular-nums",
        trendClasses,
        className
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{value}</span>
    </span>
  );
}
