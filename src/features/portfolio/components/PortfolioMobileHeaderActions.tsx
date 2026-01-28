"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import { buildPortfolioUrl } from "../lib/portfolio-url";
import { CreatePortfolioDialog } from "./CreatePortfolioDialog";
import { PortfolioSwitcher } from "./PortfolioSwitcher";

type Props = Readonly<{
  portfolios: readonly { id: string; name: string; baseCurrency: string }[];
  selectedId: string | null;
  className?: string;
}>;

export function PortfolioMobileHeaderActions({
  portfolios,
  selectedId,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";

  const handleCreated = (createdId: string) => {
    router.push(
      buildPortfolioUrl({
        pathname,
        searchParamsString,
        nextPortfolioId: createdId,
        resetPageParam: false,
      }),
      { scroll: false }
    );
    router.refresh();
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <PortfolioSwitcher portfolios={portfolios} selectedId={selectedId} />
      <CreatePortfolioDialog
        onCreated={handleCreated}
        trigger={({ open, disabled }) => (
          <Button
            className="h-9 w-full justify-start"
            disabled={disabled}
            onClick={open}
            type="button"
            variant="outline"
          >
            Nowy portfel
          </Button>
        )}
      />
    </div>
  );
}
