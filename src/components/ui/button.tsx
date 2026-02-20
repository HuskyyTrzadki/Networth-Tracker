import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border/85 text-[13px] font-semibold tracking-[0.01em] transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] active:translate-y-px active:shadow-[inset_0_1px_1px_rgb(0_0_0/0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "border-destructive/60 bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-input bg-background hover:bg-muted/30",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border-transparent bg-transparent hover:border-border/80 hover:bg-muted/35",
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline active:translate-y-0 active:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? type : (type ?? "button")}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
