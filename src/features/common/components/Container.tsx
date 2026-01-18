import { cn } from "@/lib/cn";

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function Container({ children, className }: Props) {
  return (
    <div className={cn("w-full max-w-2xl", className)}>
      {children}
    </div>
  );
}
