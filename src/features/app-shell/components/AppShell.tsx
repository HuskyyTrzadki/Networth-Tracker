"use client";

import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { GuestUpgradeBanner as GuestUpgradeBannerModel } from "@/features/auth/lib/guest-upgrade-nudge";
import {
  SidebarInset,
  SidebarProvider,
} from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { AppSidebar } from "./AppSidebar";
import { AppToastHost } from "./AppToastHost";
import { GuestUpgradeBanner } from "./GuestUpgradeBanner";
import { MobileBottomNav } from "./MobileBottomNav";
import { getPortfolioIdFromPathname } from "../lib/path";

type Props = Readonly<{
  children: React.ReactNode;
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
    isDemo: boolean;
  }[];
  demoSidebarCallout?: React.ReactNode;
  guestUpgradeBanner?: GuestUpgradeBannerModel | null;
  settingsBadge?: "guest" | "demo" | null;
  className?: string;
}>;

export function AppShell({
  children,
  portfolios,
  demoSidebarCallout = null,
  guestUpgradeBanner = null,
  settingsBadge = null,
  className,
}: Props) {
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
      <AppSidebar
        demoCallout={demoSidebarCallout}
        portfolios={portfolios}
        settingsBadge={settingsBadge}
      />
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-[var(--surface-shadow)] focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Przejdz do tresci
      </a>
      <SidebarInset
        className={cn("min-h-dvh pb-24 md:pb-0", className)}
        onKeyDownCapture={onKeyDownCapture}
      >
        <div id="main-content">
          {guestUpgradeBanner && pathname !== "/settings" ? (
            <div className="px-6 pt-6">
              <GuestUpgradeBanner banner={guestUpgradeBanner} />
            </div>
          ) : null}
          {children}
        </div>
        <MobileBottomNav />
        <AppToastHost />
      </SidebarInset>
    </SidebarProvider>
  );
}
