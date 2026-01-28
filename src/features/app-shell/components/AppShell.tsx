"use client";

import { SidebarInset, SidebarProvider } from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

type Props = Readonly<{
  children: React.ReactNode;
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[];
  className?: string;
}>;

export function AppShell({ children, portfolios, className }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar portfolios={portfolios} />
      <SidebarInset className={cn("min-h-dvh pb-24 md:pb-0", className)}>
        {children}
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
