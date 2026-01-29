"use client";

import { LayoutGrid, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/features/design-system/components/ui/sheet";
import { cn } from "@/lib/cn";

import { useAppPathname } from "../hooks/useAppPathname";
import {
  mobileActionNavItem,
  primaryNavItems,
  secondaryNavItems,
} from "../lib/nav-items";
import { isHrefActive } from "../lib/path";

type Props = Readonly<{ className?: string }>;

export function MobileBottomNav({ className }: Props) {
  const pathname = useAppPathname();

  const isAnyPrimaryActive = primaryNavItems.some((item) =>
    isHrefActive(pathname, item.href)
  );
  const isMoreActive = !isAnyPrimaryActive;
  const ActionIcon = mobileActionNavItem.icon;
  const portfolioSheetItem = {
    id: "portfolio",
    href: "/portfolio",
    icon: LayoutGrid,
    label: "Portfele",
  } as const;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 md:hidden",
        "border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
      aria-label="Główna nawigacja"
    >
      <div className="mx-auto grid h-16 max-w-xl grid-cols-4 items-center px-2">
        {primaryNavItems.map((item) => (
          <MobileNavLink key={item.id} item={item} pathname={pathname} />
        ))}

        <div className="flex items-center justify-center">
          <Link
            href={mobileActionNavItem.href}
            className={cn(
              "inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            scroll={false}
            aria-label={mobileActionNavItem.label}
          >
            <ActionIcon className="size-5" aria-hidden="true" />
          </Link>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 rounded-md px-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isMoreActive ? "text-foreground" : "text-muted-foreground"
              )}
              aria-label="Więcej"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span className="text-[11px] font-medium">Więcej</span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="max-h-[80dvh] rounded-t-xl pb-[env(safe-area-inset-bottom)]"
          >
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetClose asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                >
                  <span className="sr-only">Zamknij</span>
                  <span aria-hidden="true">×</span>
                </button>
              </SheetClose>
            </SheetHeader>

            <SheetBody className="px-2 py-2">
              <div className="space-y-1">
                {[
                  portfolioSheetItem,
                  ...primaryNavItems,
                  ...secondaryNavItems,
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isHrefActive(pathname, item.href);
                  return (
                    <SheetClose asChild key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

type MobileNavLinkProps = Readonly<{
  item: (typeof primaryNavItems)[number];
  pathname: string;
}>;

function MobileNavLink({ item, pathname }: MobileNavLinkProps) {
  const active = isHrefActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 rounded-md px-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active ? "text-foreground" : "text-muted-foreground"
      )}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="text-[11px] font-medium">{item.label}</span>
    </Link>
  );
}
