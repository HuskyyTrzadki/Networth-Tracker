import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

type ToggleGroupContextValue = Readonly<{
  value: string | undefined;
  onValueChange?: (value: string) => void;
}>;

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null
);

export type ToggleGroupProps = React.HTMLAttributes<HTMLDivElement> &
  Readonly<{
    type: "single";
    value?: string;
    onValueChange?: (value: string) => void;
  }>;

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2",
        lg: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, value, onValueChange, type, ...props }, ref) => {
    // Only "single" is supported; keep the prop for a Radix-like API.
    const _supported: "single" = type;
    void _supported;

    return (
      <ToggleGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          role="group"
          className={cn("flex items-center gap-2", className)}
          {...props}
        />
      </ToggleGroupContext.Provider>
    );
  }
);
ToggleGroup.displayName = "ToggleGroup";

export type ToggleGroupItemProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof toggleGroupItemVariants> &
    Readonly<{
      value: string;
    }>;

export const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ className, variant, size, value, disabled, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  const isActive = context?.value === value;

  return (
    <button
      ref={ref}
      type="button"
      data-state={isActive ? "on" : "off"}
      aria-pressed={isActive}
      disabled={disabled}
      className={cn(toggleGroupItemVariants({ variant, size }), className)}
      onClick={(event) => {
        props.onClick?.(event);
        if (disabled || !context?.onValueChange || isActive) return;
        context.onValueChange(value);
      }}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";
