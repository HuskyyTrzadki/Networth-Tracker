"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";
import { cn } from "@/lib/cn";

import { buildPortfolioUrl } from "../lib/portfolio-url";

const ALL_VALUE = "all";

type PortfolioOption = Readonly<{
  id: string;
  name: string;
  baseCurrency: string;
}>;

type Props = Readonly<{
  portfolios: readonly PortfolioOption[];
  selectedId: string | null;
  resetPageParam?: boolean;
  disabled?: boolean;
  className?: string;
}>;

export function PortfolioSwitcher({
  portfolios,
  selectedId,
  resetPageParam = false,
  disabled = false,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";

  const handlePortfolioChange = (nextValue: string) => {
    const nextPortfolioId = nextValue === ALL_VALUE ? null : nextValue;
    router.push(
      buildPortfolioUrl({
        pathname,
        searchParamsString,
        nextPortfolioId,
        resetPageParam,
      }),
      { scroll: false }
    );
  };

  const currentValue = selectedId ?? ALL_VALUE;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2",
        className
      )}
    >
      <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/90">
        Portfel
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          disabled={disabled}
          onValueChange={handlePortfolioChange}
          value={currentValue}
        >
          <SelectTrigger className="inline-flex h-9 min-w-[220px] justify-between whitespace-nowrap border-black/5 bg-background/70 dark:border-white/10">
            <SelectValue placeholder="Wszystkie portfele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Wszystkie portfele</SelectItem>
            {portfolios.map((portfolio) => (
              <SelectItem key={portfolio.id} value={portfolio.id}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{portfolio.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {portfolio.baseCurrency}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
