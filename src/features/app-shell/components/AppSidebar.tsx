"use client";

import { BriefcaseBusiness, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CreatePortfolioDialog } from "@/features/portfolio";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { useAppPathname } from "../hooks/useAppPathname";
import { primaryNavItems, secondaryNavItems } from "../lib/nav-items";
import { isHrefActive } from "../lib/path";

type Props = Readonly<{
  className?: string;
  portfolios: readonly {
    id: string;
    name: string;
    baseCurrency: string;
  }[];
}>;

export function AppSidebar({ className, portfolios }: Props) {
  const pathname = useAppPathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePortfolioId = searchParams?.get("portfolio") ?? null;
  const isPortfolioActive = isHrefActive(pathname, "/portfolio");
  const isOverviewActive =
    isPortfolioActive && (!activePortfolioId || activePortfolioId === "all");

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "h-svh w-[24rem] min-w-[24rem] max-w-[24rem] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <SidebarHeader className="px-4 py-5">
        <Link
          href="/portfolio?portfolio=all"
          className="flex items-center gap-3 rounded-md px-2 py-1 text-lg font-semibold tracking-tight text-sidebar-foreground"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent/40">
            <BriefcaseBusiness className="size-[18px] text-primary" aria-hidden="true" />
          </span>
          Portfolio Tracker
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-3">
        <SidebarGroup className="py-1.5">
          <SidebarGroupLabel className="px-3 text-sm font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55">
            Nawigacja
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => {
                const active =
                  item.id === "overview"
                    ? isOverviewActive
                    : isHrefActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "h-12 rounded-lg px-4 text-base font-medium text-sidebar-foreground/90",
                        "[&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/65",
                        "data-[active=true]:bg-primary/15 data-[active=true]:text-sidebar-foreground data-[active=true]:font-semibold",
                        "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.38)]",
                        "[&[data-active=true]>svg]:text-primary"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1.5">
          <SidebarGroupLabel className="px-3 text-sm font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55">
            Portfele
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-1 py-1">
              {portfolios.map((portfolio) => (
                <SidebarMenuSubItem key={portfolio.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={activePortfolioId === portfolio.id}
                    className={cn(
                      "h-12 rounded-lg px-4 text-base font-medium text-sidebar-foreground/85",
                      "data-[active=true]:bg-primary/15 data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground",
                      "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.38)]"
                    )}
                  >
                    <Link href={`/portfolio?portfolio=${portfolio.id}`}>
                      <span className="min-w-0 flex-1 truncate">{portfolio.name}</span>
                      <span className="ml-auto font-mono text-[11px] text-sidebar-foreground/45 tabular-nums">
                        {portfolio.baseCurrency}
                      </span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
              <SidebarMenuSubItem>
                <CreatePortfolioDialog
                  onCreated={(createdId) => {
                    router.push(`/portfolio?portfolio=${createdId}`, {
                      scroll: false,
                    });
                    router.refresh();
                  }}
                  trigger={({ open, disabled }) => (
                    <Button
                      className="h-12 w-full justify-start gap-2 rounded-lg border border-primary/35 bg-primary/10 px-4 text-base font-semibold text-primary hover:bg-primary/15 hover:text-primary"
                      disabled={disabled}
                      onClick={open}
                      type="button"
                      variant="ghost"
                    >
                      <Plus className="size-[18px]" aria-hidden="true" />
                      Nowy portfel
                    </Button>
                  )}
                />
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {secondaryNavItems.map((item) => {
            const active = isHrefActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={cn(
                    "h-12 rounded-lg px-4 text-base font-medium text-sidebar-foreground/85",
                    "[&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/65",
                    "data-[active=true]:bg-primary/15 data-[active=true]:text-sidebar-foreground data-[active=true]:font-semibold",
                    "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.38)]",
                    "[&[data-active=true]>svg]:text-primary"
                  )}
                >
                  <Link href={item.href}>
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
