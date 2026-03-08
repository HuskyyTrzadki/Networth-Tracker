"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, useState, useTransition } from "react";

import { dispatchAppToast } from "@/features/app-shell/lib/app-toast-events";
import { deletePortfolioAction } from "@/features/portfolio/server/delete-portfolio-action";
import { Button } from "@/features/design-system/components/ui/button";
import { DemoPortfolioBadge } from "@/features/portfolio/components/DemoPortfolioBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/features/design-system/components/ui/sidebar";
import { cn } from "@/lib/cn";

import { LinkLabel } from "./SidebarLinkLabel";

type Props = Readonly<{
  portfolio: {
    id: string;
    name: string;
    baseCurrency: string;
    isDemo: boolean;
  };
  isActive: boolean;
  onDeleteOptimistic: (portfolioId: string) => void;
  onDeleteRollback: (portfolioId: string) => void;
  onNavigateIntent: (href: string) => void;
  onPrefetchIntent: (href: string) => void;
}>;

const menuItemClasses =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60";

export function PortfolioSidebarItem({
  portfolio,
  isActive,
  onDeleteOptimistic,
  onDeleteRollback,
  onNavigateIntent,
  onPrefetchIntent,
}: Props) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setIsDialogOpen(false);
    startTransition(() => {
      onDeleteOptimistic(portfolio.id);
      void deletePortfolioAction(portfolio.id)
        .then(() => {
          dispatchAppToast({
            title: "Portfel usunięty.",
            description: "Zmiany zostały zapisane.",
            tone: "success",
          });
        })
        .catch((error: unknown) => {
          onDeleteRollback(portfolio.id);
          dispatchAppToast({
            title: "Nie udało się usunąć portfela.",
            description:
              error instanceof Error && error.message.length > 0
                ? error.message
                : "Spróbuj ponownie za chwilę.",
            tone: "destructive",
          });
        });
    });
  };

  const portfolioHref = `/portfolio/${portfolio.id}`;

  const handlePortfolioNavigationClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    onNavigateIntent(portfolioHref);
  };

  return (
    <SidebarMenuSubItem className="group/menu-item relative">
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
        className={cn(
          "relative h-10 rounded-md px-4 pr-12 text-sm font-medium text-sidebar-foreground/85",
          "data-[active=true]:bg-primary/14 data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground",
          "data-[active=true]:ring-1 data-[active=true]:ring-primary/30",
          "data-[active=true]:before:absolute data-[active=true]:before:bottom-1.5 data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:w-[2px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-foreground data-[active=true]:before:content-['']"
        )}
      >
        <Link
          href={portfolioHref}
          prefetch={true}
          onMouseEnter={() => onPrefetchIntent(portfolioHref)}
          onClick={handlePortfolioNavigationClick}
        >
          <LinkLabel className="min-w-0 flex-1 truncate">{portfolio.name}</LinkLabel>
          {portfolio.isDemo ? (
            <DemoPortfolioBadge className="ml-auto mr-2 shrink-0 border-emerald-800/70 bg-emerald-400 px-2 py-0.5 text-[9px] tracking-[0.18em] text-emerald-950" />
          ) : null}
          <span className="font-mono text-[11px] text-sidebar-foreground/45 tabular-nums">
            {portfolio.baseCurrency}
          </span>
        </Link>
      </SidebarMenuSubButton>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <SidebarMenuAction
            aria-label={`Więcej akcji: ${portfolio.name}`}
            className={cn(
              "right-1 top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-md",
              "hover:bg-sidebar-accent/80",
              isPopoverOpen ? "opacity-100" : null
            )}
            type="button"
            showOnHover
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </SidebarMenuAction>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-36 p-1.5"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Link
            className={cn(menuItemClasses, "justify-between")}
            href={`/transactions/new?portfolio=${portfolio.id}`}
            onClick={() => setIsPopoverOpen(false)}
            scroll={false}
          >
            <span>Dodaj transakcję</span>
            <Plus className="size-4 shrink-0" aria-hidden />
          </Link>
          <button
            className={cn(menuItemClasses, "text-destructive")}
            onClick={() => {
              setIsPopoverOpen(false);
              setIsDialogOpen(true);
            }}
            type="button"
          >
            Usuń
          </button>
        </PopoverContent>
      </Popover>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(nextOpen) => {
          if (isPending) {
            return;
          }
          setIsDialogOpen(nextOpen);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Usunąć portfel?</DialogTitle>
            <DialogDescription>
              Ta operacja usunie portfel {portfolio.name} wraz z jego transakcjami.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => setIsDialogOpen(false)}
              type="button"
              variant="ghost"
            >
              Anuluj
            </Button>
            <Button
              disabled={isPending}
              onClick={handleDelete}
              type="button"
              variant="destructive"
            >
              {isPending ? "Usuwanie..." : "Usuń portfel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuSubItem>
  );
}
