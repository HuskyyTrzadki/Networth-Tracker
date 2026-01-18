import { cn } from "@/lib/cn";

type Props = Readonly<{
  values: readonly number[];
  className?: string;
}>;

export function Sparkline({ values, className }: Props) {
  const safeValues = values.length >= 2 ? values : [0, 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(1, max - min);

  const points = safeValues
    .map((v, idx) => {
      const x = (idx / (safeValues.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-8 w-20 text-chart-1", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

