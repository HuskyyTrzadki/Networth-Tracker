import { StartRealPortfolioButton } from "@/features/auth/ui/StartRealPortfolioButton";
import { DemoPortfolioBadge } from "@/features/portfolio";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  className?: string;
}>;

export function DemoAccountCallout({ className }: Props) {
  return (
    <section
      className={cn(
        "rounded-lg border border-emerald-700/25 bg-emerald-50/80 p-3 shadow-[var(--surface-shadow)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-emerald-950">To jest konto demo</p>
        <DemoPortfolioBadge className="px-2 py-1 text-[9px] tracking-[0.16em]" />
      </div>
      <p className="mt-2 text-xs leading-5 text-emerald-900/80">Wróć do onboardingu</p>
      <div className="mt-3">
        <StartRealPortfolioButton className="h-9 rounded-md" />
      </div>
    </section>
  );
}
