import { cn } from "@/lib/cn";

type Props = Readonly<{
  className?: string;
}>;

export function DemoPortfolioBadge({ className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-emerald-700/70 bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-950 shadow-[var(--surface-shadow)]",
        className
      )}
    >
      Demo
    </span>
  );
}
