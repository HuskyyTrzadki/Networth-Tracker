import { cn } from "@/lib/cn";

type Props = Readonly<{
  values: readonly number[];
  className?: string;
  strokeWidth?: number;
}>;

export function Sparkline({ values, className, strokeWidth = 6 }: Props) {
  const safeValues = values.length >= 2 ? values : [0, 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const hasVariation = max !== min;
  const range = hasVariation ? max - min : 1;
  const clampedStrokeWidth = Math.max(1, Math.min(strokeWidth, 10));
  const halfStroke = clampedStrokeWidth / 2;
  const minX = halfStroke;
  const maxX = 100 - halfStroke;
  const verticalPadding = 16 + halfStroke;
  const minY = verticalPadding;
  const maxY = 100 - verticalPadding;

  const points = safeValues
    .map((v, idx) => {
      const ratio =
        safeValues.length <= 1 ? 0 : idx / (safeValues.length - 1);
      const x = minX + ratio * (maxX - minX);
      const y = hasVariation
        ? maxY - ((v - min) / range) * (maxY - minY)
        : 50;
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
        strokeWidth={clampedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        shapeRendering="geometricPrecision"
      />
    </svg>
  );
}
