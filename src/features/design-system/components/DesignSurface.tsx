import { cn } from "@/lib/cn";

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function DesignSurface({ children, className }: Props) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {children}
    </div>
  );
}

