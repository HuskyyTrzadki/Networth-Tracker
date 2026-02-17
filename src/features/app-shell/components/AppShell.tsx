"use client";

import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  SidebarInset,
  SidebarProvider,
} from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { AppSidebar } from "./AppSidebar";
import { AppToastHost } from "./AppToastHost";
import { MobileBottomNav } from "./MobileBottomNav";
import { getPortfolioIdFromPathname } from "../lib/path";

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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const sidebarStyle = {
    "--sidebar-width": "24rem",
    "--sidebar-width-icon": "3.5rem",
  } as CSSProperties;

  const isTypingElement = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    if (target.isContentEditable) return true;
    return tag === "input" || tag === "textarea" || tag === "select";
  };

  const onKeyDownCapture = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      window.dispatchEvent(new Event("app:close-modal"));
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
      return;
    }

    if (event.key === "/" && !isTypingElement(event.target)) {
      event.preventDefault();
      window.dispatchEvent(new Event("app:focus-search"));
      return;
    }

    if (event.key.toLowerCase() === "n" && !isTypingElement(event.target)) {
      event.preventDefault();
      const activePortfolioId = getPortfolioIdFromPathname(pathname);
      const href = activePortfolioId
        ? `/transactions/new?portfolio=${activePortfolioId}`
        : "/transactions/new";
      router.push(href, { scroll: false });
    }
  };

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar portfolios={portfolios} />
      <SidebarInset
        className={cn("min-h-dvh pb-24 md:pb-0", className)}
        onKeyDownCapture={onKeyDownCapture}
      >
        {children}
        <MobileBottomNav />
        <AppToastHost />
      </SidebarInset>
    </SidebarProvider>
  );
}
