"use client";

import { Newspaper, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { createClient } from "@/lib/supabase/client";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export function ReportShell({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const syncSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) {
        return;
      }
      const user = data.user ?? null;
      setHasSession(Boolean(user));
    };

    void syncSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setHasSession(Boolean(user));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

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

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <div className="pointer-events-none fixed left-4 top-4 z-50 sm:left-6 sm:top-5">
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "pointer-events-auto h-9 rounded-md border-border/90 px-3 text-xs font-semibold tracking-[0.02em]",
                isMenuOpen ? "bg-foreground text-background hover:bg-foreground" : ""
              )}
            >
              Menu
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent
          side="top"
          className="border-b border-dashed border-border/85 bg-background/98 px-4 py-4 backdrop-blur-[2px] sm:px-6"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Nawigacja raportu</SheetTitle>
          </SheetHeader>
          <SheetBody className="w-full px-0 py-0">
            <div className="flex flex-wrap items-center gap-3">
              <SheetClose asChild>
                <Link
                  href="/"
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border/85 px-3 text-sm font-semibold tracking-tight hover:bg-muted/35"
                >
                  <Newspaper className="size-4" aria-hidden />
                  Portfolio Tracker
                </Link>
              </SheetClose>

              <form onSubmit={onSearchSubmit} className="min-w-0 flex-1">
                <label htmlFor="report-menu-search" className="sr-only">
                  Search stocks and ETFs
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="report-menu-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search Stocks & ETFs (NASDAQ & NYSE)"
                    className="h-11 rounded-full border-[2px] border-border/95 pl-12 pr-4 text-[0.97rem]"
                  />
                </div>
              </form>

              <div className="ml-auto flex items-center gap-2">
                <SheetClose asChild>
                  <Button asChild size="sm" variant="outline" className="h-10 px-3 text-sm">
                    <Link href="/portfolio">Portfolio management</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild size="sm" variant="outline" className="h-10 px-3 text-sm">
                    <Link href={hasSession ? "/settings" : "/login"}>Account</Link>
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <main className="w-full px-3 pb-8 pt-14 sm:px-3 sm:pt-14">
        {children}
      </main>
    </div>
  );
}
