"use client";

import { BriefcaseBusiness, Loader2, Plus } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { useAppPathname } from "../hooks/useAppPathname";
import { primaryNavItems, secondaryNavItems } from "../lib/nav-items";
import { getPortfolioIdFromPathname, isHrefActive } from "../lib/path";
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
                        "h-11 rounded-lg px-4 text-[15px] font-medium text-sidebar-foreground/90",
                        "[&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/65",
                        "data-[active=true]:bg-primary/14 data-[active=true]:text-sidebar-foreground data-[active=true]:font-semibold",
                        "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.32)]",
                        "[&[data-active=true]>svg]:text-primary"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon aria-hidden="true" />
                        <PendingLinkLabel>{item.label}</PendingLinkLabel>
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
                <SidebarMenuSubItem key={portfolio.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={activePortfolioId === portfolio.id}
                    className={cn(
                      "h-11 rounded-lg px-4 text-[15px] font-medium text-sidebar-foreground/85",
                      "data-[active=true]:bg-primary/14 data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground",
                      "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.32)]"
                    )}
                  >
                    <Link href={`/portfolio/${portfolio.id}`} prefetch={false}>
                      <PendingLinkLabel className="min-w-0 flex-1 truncate">
                        {portfolio.name}
                      </PendingLinkLabel>
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
                    router.push(`/portfolio/${createdId}`, {
                      scroll: false,
                    });
                  }}
                  trigger={({ open, disabled }) => (
                    <Button
                      className="mt-1 h-10 w-full justify-start gap-2 rounded-lg border border-primary/35 bg-primary/12 px-4 text-[13px] font-semibold text-primary hover:bg-primary/18"
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
                    "h-11 rounded-lg px-4 text-[15px] font-medium text-sidebar-foreground/85",
                    "[&>svg]:size-[18px] [&>svg]:text-sidebar-foreground/65",
                    "data-[active=true]:bg-primary/14 data-[active=true]:text-sidebar-foreground data-[active=true]:font-semibold",
                    "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.32)]",
                    "[&[data-active=true]>svg]:text-primary"
                  )}
                >
                  <Link href={item.href}>
                    <Icon aria-hidden="true" />
                    <PendingLinkLabel>{item.label}</PendingLinkLabel>
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

type PendingLinkLabelProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

function PendingLinkLabel({ children, className }: PendingLinkLabelProps) {
  const { pending } = useLinkStatus();

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="truncate">{children}</span>
      {pending ? <Loader2 className="size-3 animate-spin text-primary" aria-hidden /> : null}
    </span>
  );
}
