import { cn } from "@/lib/cn";

import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function AppShell({ children, className }: Props) {
  return (
    <div className={cn("flex min-h-dvh w-full bg-background", className)}>
      <AppSidebar />

      <div className="min-w-0 flex-1">
        <div className="min-h-dvh pb-24 md:pb-0">{children}</div>
        <MobileBottomNav />
      </div>
    </div>
  );
}

