"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { deletePortfolio } from "@/features/portfolio/client/delete-portfolio";
import { Button } from "@/features/design-system/components/ui/button";
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
  };
  isActive: boolean;
  onDeleted: (portfolioId: string) => void;
}>;

const menuItemClasses =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60";

export function PortfolioSidebarItem({ portfolio, isActive, onDeleted }: Props) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deletePortfolio(portfolio.id);
      setIsDialogOpen(false);
      onDeleted(portfolio.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Nie udało się usunąć portfela."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SidebarMenuSubItem className="group relative">
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
        <Link href={`/portfolio/${portfolio.id}`}>
          <LinkLabel className="min-w-0 flex-1 truncate">{portfolio.name}</LinkLabel>
          <span className="ml-auto font-mono text-[11px] text-sidebar-foreground/45 tabular-nums">
            {portfolio.baseCurrency}
          </span>
        </Link>
      </SidebarMenuSubButton>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-label={`Więcej akcji: ${portfolio.name}`}
            className={cn(
              "absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md border-none px-0",
              "pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
              isPopoverOpen ? "pointer-events-auto opacity-100" : null
            )}
            size="icon"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-36 p-1.5">
          <button
            className={cn(menuItemClasses, "text-destructive")}
            onClick={() => {
              setIsPopoverOpen(false);
              setErrorMessage(null);
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
          if (isDeleting) {
            return;
          }
          setIsDialogOpen(nextOpen);
          if (!nextOpen) {
            setErrorMessage(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Usunąć portfel?</DialogTitle>
            <DialogDescription>
              Ta operacja usunie portfel {portfolio.name} wraz z jego transakcjami.
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <DialogFooter>
            <Button
              disabled={isDeleting}
              onClick={() => setIsDialogOpen(false)}
              type="button"
              variant="ghost"
            >
              Anuluj
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              type="button"
              variant="destructive"
            >
              Usuń portfel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuSubItem>
  );
}
