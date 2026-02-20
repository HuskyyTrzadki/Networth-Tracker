import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/80 bg-primary text-primary-foreground",
        secondary: "border-border/70 bg-secondary text-secondary-foreground",
        outline: "border-border/90 bg-background text-foreground",
        stamp:
          "border-muted-foreground/60 bg-transparent text-muted-foreground/70 normal-case font-medium tracking-[0.02em]",
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
