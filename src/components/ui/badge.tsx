import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.05em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border/75 bg-background/90 text-foreground/85 normal-case tracking-[0.03em]",
        secondary: "border-border/65 bg-secondary/75 text-secondary-foreground/90",
        outline: "border-border/75 bg-background text-foreground/80",
        stamp:
          "border-muted-foreground/50 bg-transparent text-muted-foreground/75 normal-case tracking-[0.02em]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
