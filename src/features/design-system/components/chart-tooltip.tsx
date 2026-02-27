"use client";

import { type ReactNode } from "react";

type TrendTooltipShellProps = Readonly<{
  label: string | null;
  children: ReactNode;
}>;

export function TrendTooltipShell({ label, children }: TrendTooltipShellProps) {
  return (
    <div className="space-y-2 rounded-md border border-dashed border-border/75 bg-popover/98 p-3 text-xs text-popover-foreground shadow-[var(--surface-shadow)]">
      <div className="border-b border-dashed border-border/65 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">
        {label ?? "—"}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

type TrendTooltipRowProps = Readonly<{
  label: string;
  value: string;
  color?: string;
  bordered?: boolean;
}>;

export function TrendTooltipRow({
  label,
  value,
  color,
  bordered = false,
}: TrendTooltipRowProps) {
  return (
    <div
      className={
        bordered
          ? "flex items-center justify-between gap-4 border-t border-dashed border-border/70 pt-1.5"
          : "flex items-center justify-between gap-4"
      }
    >
      <div className="flex items-center gap-2">
        {color ? (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
            aria-hidden="true"
          />
        ) : null}
        <span>{label}</span>
      </div>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}
