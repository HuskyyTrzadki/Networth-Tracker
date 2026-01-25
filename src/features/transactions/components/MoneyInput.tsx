import type React from "react";

import { Input } from "@/features/design-system/components/ui/input";
import { cn } from "@/lib/cn";

type Props = Readonly<
  Omit<React.ComponentProps<typeof Input>, "type"> & {
    currency: string;
  }
>;

export function MoneyInput({ currency, className, ...props }: Props) {
  const hasCurrency = currency.trim().length > 0;

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn(
          "font-mono tabular-nums text-right",
          hasCurrency && "pr-14",
          className
        )}
        inputMode="decimal"
        type="text"
      />
      {hasCurrency ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="font-mono text-xs text-muted-foreground">
            {currency}
          </span>
        </div>
      ) : null}
    </div>
  );
}
