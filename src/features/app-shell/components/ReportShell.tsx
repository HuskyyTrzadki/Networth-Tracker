"use client";

import { Newspaper, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
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

type Props = Readonly<{
  children: React.ReactNode;
  accountControls?: React.ReactNode;
}>;

type MenuTriggerCtx = Readonly<{
  mountCustomTrigger: () => void;
  unmountCustomTrigger: () => void;
  isMenuOpen: boolean;
}>;

const ReportShellMenuTriggerContext = createContext<MenuTriggerCtx | null>(null);

export function ReportShellMenuTrigger({
  className,
}: Readonly<{
  className?: string;
}>) {
  const ctx = useContext(ReportShellMenuTriggerContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.mountCustomTrigger();
    return () => {
      ctx.unmountCustomTrigger();
    };
  }, [ctx]);

  return (
    <SheetTrigger asChild>
      <Button
        size="sm"
        variant="outline"
        className={cn(
          "h-9 rounded-md border border-[color:var(--report-rule)] bg-background px-3 text-[11px] font-semibold uppercase tracking-[0.08em]",
          ctx?.isMenuOpen ? "bg-foreground text-background hover:bg-foreground" : "",
          className
        )}
      >
        Menu
      </Button>
    </SheetTrigger>
  );
}

export function ReportShell({ children, accountControls = null }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customTriggerCount, setCustomTriggerCount] = useState(0);
  const router = useRouter();

  const mountCustomTrigger = () => {
    setCustomTriggerCount((value) => value + 1);
  };

  const unmountCustomTrigger = () => {
    setCustomTriggerCount((value) => Math.max(0, value - 1));
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/stocks");
      setIsMenuOpen(false);
      return;
    }
    router.push(`/stocks?query=${encodeURIComponent(trimmed)}`);
    setIsMenuOpen(false);
  };

  const menuTriggerContext: MenuTriggerCtx = {
    mountCustomTrigger,
    unmountCustomTrigger,
    isMenuOpen,
  };
  const hasCustomTrigger = customTriggerCount > 0;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <ReportShellMenuTriggerContext.Provider value={menuTriggerContext}>
          {!hasCustomTrigger ? (
            <div className="pointer-events-none fixed left-7 top-4 z-50 sm:left-10 sm:top-5 lg:left-16 xl:left-20">
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "pointer-events-auto h-9 rounded-md border border-[color:var(--report-rule)] bg-background px-3 text-[11px] font-semibold uppercase tracking-[0.08em]",
                    isMenuOpen ? "bg-foreground text-background hover:bg-foreground" : ""
                  )}
                >
                  Menu
                </Button>
              </SheetTrigger>
            </div>
          ) : null}

          <SheetContent
            side="top"
            className="border-b border-dashed border-[color:var(--report-rule)] bg-background/98 px-4 py-3 backdrop-blur-[2px] sm:px-5"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Nawigacja raportu</SheetTitle>
            </SheetHeader>
            <SheetBody className="w-full px-0 py-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <SheetClose asChild>
                  <Link
                    href="/"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-[color:var(--report-rule)] px-3 text-sm font-semibold tracking-tight hover:bg-muted/35"
                  >
                    <Newspaper className="size-4" aria-hidden />
                    Portfolio Tracker
                  </Link>
                </SheetClose>

                <form onSubmit={onSearchSubmit} className="min-w-0 flex-1">
                  <label htmlFor="report-menu-search" className="sr-only">
                    Szukaj akcji i ETF-ów
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="report-menu-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Szukaj akcji i ETF-ów"
                      className="h-10 rounded-md border-[color:var(--report-rule)] bg-background pl-12 pr-4 text-sm"
                    />
                  </div>
                </form>

                <div className="ml-auto flex items-center gap-2">
                  <SheetClose asChild>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-9 border-[color:var(--report-rule)] px-3 text-sm"
                    >
                      <Link href="/portfolio">Portfel</Link>
                    </Button>
                  </SheetClose>
                  {accountControls}
                </div>
              </div>
            </SheetBody>
          </SheetContent>

          <main className="w-full px-3 pb-8 pt-14 sm:px-4 lg:px-6 xl:px-8 sm:pt-14">
            {children}
          </main>
        </ReportShellMenuTriggerContext.Provider>
      </Sheet>

    </div>
  );
}
