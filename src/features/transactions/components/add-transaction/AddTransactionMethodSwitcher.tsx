"use client";

import { ScanSearch, SquarePen } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  mode: "MANUAL" | "SCREENSHOT";
  onModeChange: (nextMode: "MANUAL" | "SCREENSHOT") => void;
}>;

const OPTION_BASE_CLASS =
  "flex h-auto min-h-24 flex-col items-start gap-2 rounded-lg border px-4 py-3 text-left";

export function AddTransactionMethodSwitcher({ mode, onModeChange }: Props) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/82">
          Sposób dodania
        </p>
        <h3 className="mt-1 text-sm font-semibold text-foreground">
          Zacznij od metody, która jest dla Ciebie szybsza
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Możesz księgować ręcznie albo przejść od razu do importu ze zrzutu.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            OPTION_BASE_CLASS,
            mode === "MANUAL"
              ? "border-border/80 bg-background/86 text-foreground"
              : "border-border/60 bg-background/52 text-muted-foreground"
          )}
          onClick={() => onModeChange("MANUAL")}
        >
          <SquarePen className="size-4" aria-hidden />
          <span className="text-sm font-semibold">Ręcznie</span>
          <span className="text-xs leading-5">
            Najlepsze, gdy chcesz opisać pojedynczą decyzję dokładnie.
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className={cn(
            OPTION_BASE_CLASS,
            mode === "SCREENSHOT"
              ? "border-border/80 bg-background/86 text-foreground"
              : "border-border/60 bg-background/52 text-muted-foreground"
          )}
          onClick={() => onModeChange("SCREENSHOT")}
        >
          <ScanSearch className="size-4" aria-hidden />
          <span className="text-sm font-semibold">Zrzut ekranu</span>
          <span className="text-xs leading-5">
            Szybszy start, jeśli masz już widok rachunku u brokera.
          </span>
        </Button>
      </div>
    </section>
  );
}
