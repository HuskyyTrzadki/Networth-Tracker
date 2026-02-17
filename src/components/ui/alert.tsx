import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border border-border px-4 py-3 text-sm text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background",
        destructive: "border-destructive/50 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

export type AlertTitleProps = React.HTMLAttributes<HTMLDivElement>;

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

export function AlertDescription({
  className,
  ...props
}: AlertDescriptionProps) {
  return (
    <div className={cn("text-sm text-foreground", className)} {...props} />
  );
}
