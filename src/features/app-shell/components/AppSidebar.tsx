"use client";

import { BriefcaseBusiness, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  SidebarMenuSubItem,
} from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { useAppPathname } from "../hooks/useAppPathname";
import { primaryNavItems, secondaryNavItems } from "../lib/nav-items";
import { getPortfolioIdFromPathname, isHrefActive } from "../lib/path";
import { PortfolioSidebarItem } from "./PortfolioSidebarItem";
import { LinkLabel } from "./SidebarLinkLabel";
import { ThemeSwitch } from "./ThemeSwitch";

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
  const activePortfolioId = getPortfolioIdFromPathname(pathname);
  const isPortfolioActive = isHrefActive(pathname, "/portfolio");
  const isOverviewActive = isPortfolioActive && !activePortfolioId;

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "sticky top-0 h-svh w-[24rem] min-w-[24rem] max-w-[24rem] shrink-0 border-r border-sidebar-border/85 bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <SidebarHeader className="px-4 py-5">
        <Link
          href="/portfolio"
          className="flex items-center gap-3 rounded-md px-2 py-1 text-lg font-semibold tracking-tight text-sidebar-foreground"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-sidebar-border/80 bg-sidebar-accent/55">
            <BriefcaseBusiness className="size-[18px] text-primary" aria-hidden="true" />
          </span>
          Portfolio Tracker
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-3">
        <SidebarGroup className="py-1.5">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55">
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
                        "relative h-10 rounded-md px-4 text-sm font-medium text-sidebar-foreground/90",
                        "[&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/65",
                        "data-[active=true]:bg-primary/14 data-[active=true]:text-sidebar-foreground data-[active=true]:font-semibold",
                        "data-[active=true]:ring-1 data-[active=true]:ring-primary/30",
                        "data-[active=true]:before:absolute data-[active=true]:before:bottom-1.5 data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:w-[2px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-foreground data-[active=true]:before:content-['']",
                        "[&[data-active=true]>svg]:text-primary"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon aria-hidden="true" />
                        <LinkLabel>{item.label}</LinkLabel>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1.5">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
            Twoje portfele
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-1 py-1">
              {portfolios.map((portfolio) => (
                <PortfolioSidebarItem
                  key={portfolio.id}
                  isActive={activePortfolioId === portfolio.id}
                  onDeleted={(deletedPortfolioId) => {
                    if (activePortfolioId === deletedPortfolioId) {
                      router.push("/portfolio", { scroll: false });
                    }
                    router.refresh();
                  }}
                  portfolio={portfolio}
                />
              ))}
              <SidebarMenuSubItem>
                <CreatePortfolioDialog
                  onCreated={(createdId) => {
                    router.push(`/portfolio/${createdId}`, {
                      scroll: false,
                    });
                  }}
                  trigger={({ open, disabled }) => (
                    <Button
                      className="mt-1 h-10 w-full justify-start gap-2 rounded-md border border-primary/35 bg-primary/12 px-4 text-[13px] font-semibold text-primary hover:bg-primary/18"
                      disabled={disabled}
                      onClick={open}
                      type="button"
                      variant="ghost"
                    >
                      <Plus className="size-[16px]" aria-hidden="true" />
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
        <div className="px-2 pt-2">
          <ThemeSwitch />
        </div>
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
                    "relative h-10 rounded-md px-4 text-sm font-medium text-sidebar-foreground/85",
                    "[&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/65",
                    "data-[active=true]:bg-primary/14 data-[active=true]:text-sidebar-foreground data-[active=true]:font-semibold",
                    "data-[active=true]:ring-1 data-[active=true]:ring-primary/30",
                    "data-[active=true]:before:absolute data-[active=true]:before:bottom-1.5 data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:w-[2px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-foreground data-[active=true]:before:content-['']",
                    "[&[data-active=true]>svg]:text-primary"
                  )}
                >
                  <Link href={item.href}>
                    <Icon aria-hidden="true" />
                    <LinkLabel>{item.label}</LinkLabel>
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
