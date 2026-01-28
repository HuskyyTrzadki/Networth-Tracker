"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { CreatePortfolioDialog } from "@/features/portfolio";
import { Button } from "@/features/design-system/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/design-system/components/ui/collapsible";
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

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <SidebarHeader className="px-3 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Portfolio Tracker
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => {
                const active = isHrefActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={active}>
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

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center gap-2">
                <span>Portfele</span>
                <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub>
                  {portfolios.map((portfolio) => (
                    <SidebarMenuSubItem key={portfolio.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={activePortfolioId === portfolio.id}
                      >
                        <Link href={`/portfolio?portfolio=${portfolio.id}`}>
                          <span className="min-w-0 flex-1 truncate">
                            {portfolio.name}
                          </span>
                          <span className="ml-auto text-[11px] text-sidebar-foreground/60 tabular-nums">
                            {portfolio.baseCurrency}
                          </span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
                <div className="px-3 pt-1">
                  <CreatePortfolioDialog
                    onCreated={(createdId) => {
                      router.push(`/portfolio?portfolio=${createdId}`, {
                        scroll: false,
                      });
                      router.refresh();
                    }}
                    trigger={({ open, disabled }) => (
                      <Button
                        className="h-7 w-full justify-start px-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
                        disabled={disabled}
                        onClick={open}
                        type="button"
                        variant="ghost"
                      >
                        Nowy portfel
                      </Button>
                    )}
                  />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {secondaryNavItems.map((item) => {
            const active = isHrefActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild isActive={active}>
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
