import type React from "react";

import { Input } from "@/features/design-system/components/ui/input";
import { cn } from "@/lib/cn";
import { formatNumericInputWithCursor } from "../lib/format-numeric-input";

type Props = Readonly<
  Omit<React.ComponentProps<typeof Input>, "type"> & {
    currency: string;
  }
>;

export function MoneyInput({ currency, className, ...props }: Props) {
  const { onChange, ...restProps } = props;
  const hasCurrency = currency.trim().length > 0;

  return (
    <div className="relative">
      <Input
        {...restProps}
        className={cn(
          "font-mono tabular-nums text-right",
          hasCurrency && "pr-14",
          className
        )}
        inputMode="decimal"
        onChange={(event) => {
          const next = formatNumericInputWithCursor(
            event.target.value,
            event.target.selectionStart
          );
          event.target.value = next.value;
          onChange?.(event);
          if (next.cursor !== null) {
            requestAnimationFrame(() => {
              event.target.setSelectionRange(next.cursor, next.cursor);
            });
          }
        }}
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
