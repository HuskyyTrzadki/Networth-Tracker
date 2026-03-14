"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { ReportShellMenuTrigger } from "@/features/app-shell/components/ReportShell";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { cn } from "@/lib/cn";

import { FactRow } from "./ReportRows";

type SidebarProps = Readonly<{
  symbol: string;
  name: string;
  logoUrl: string | null;
  favoriteControl: React.ReactNode;
  exchange: string;
  region: string;
  metricCurrency: string;
  marketCap: string;
  peTtm: string;
  dividendYield: string;
  asOf: string;
}>;

const SECTION_LINKS = [
  { id: "sekcja-snapshot", label: "Snapshot" },
  { id: "sekcja-wykres", label: "Wykres ceny" },
  { id: "sekcja-fundamenty", label: "Wycena i fundamenty" },
  { id: "sekcja-jak-zarabia", label: "Jak firma zarabia" },
  { id: "sekcja-bilans", label: "Bilans" },
  { id: "sekcja-trendy", label: "Trendy finansowe" },
  { id: "sekcja-zaawansowane", label: "Dalsza analiza" },
] as const;

export default function StockReportSidebar({
  symbol,
  name,
  logoUrl,
  favoriteControl,
  exchange,
  region,
  metricCurrency,
  marketCap,
  peTtm,
  dividendYield,
  asOf,
}: SidebarProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTION_LINKS[0].id);
  const sectionIds = useMemo<readonly string[]>(
    () => SECTION_LINKS.map((link) => link.id),
    []
  );
  const sectionIdSet = useMemo(() => new Set(sectionIds), [sectionIds]);

  useEffect(() => {
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    const resolveActiveSection = () => {
      if (sectionElements.length === 0) return;

      const activationOffset = 156;
      const viewportBottom = window.innerHeight;
      let nextActive = sectionElements[0]?.id ?? sectionIds[0];

      for (const section of sectionElements) {
        const rect = section.getBoundingClientRect();
        if (rect.top - activationOffset <= 0) {
          nextActive = section.id;
          continue;
        }
        break;
      }

      const lastSection = sectionElements.at(-1);
      if (lastSection) {
        const lastRect = lastSection.getBoundingClientRect();
        if (lastRect.top < viewportBottom * 0.58) {
          nextActive = lastSection.id;
        }
      }

      setActiveSectionId((prev) => (prev === nextActive ? prev : nextActive));
    };

    const updateFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.length > 0 && sectionIdSet.has(hash)) {
        setActiveSectionId(hash);
      }
    };

    updateFromHash();
    resolveActiveSection();

    let rafId: number | null = null;
    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        resolveActiveSection();
      });
    };

    window.addEventListener("hashchange", updateFromHash);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("hashchange", updateFromHash);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [sectionIds, sectionIdSet]);

  return (
    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8 lg:self-start lg:h-[calc(100dvh-4rem)] lg:border-r lg:border-dashed lg:border-[color:var(--report-rule)]/20 lg:pr-4 lg:pt-4">
      <div className="space-y-4 bg-background">
        <section className="border-b border-dashed border-[color:var(--report-rule)]/20 pb-4">
          <div className="flex items-center gap-2">
            <ReportShellMenuTrigger className="px-2" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
              Raport spolki
            </p>
          </div>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <InstrumentLogoImage
                src={logoUrl}
                size={52}
                fallbackText={symbol}
                alt={name}
                loading="eager"
                priority
              />
              <div className="min-w-0">
                <h1 className="truncate text-[1.75rem] font-semibold tracking-tight">
                  {symbol}
                </h1>
                <p className="truncate text-[13px] text-muted-foreground">{name}</p>
              </div>
            </div>
            {favoriteControl}
          </div>

          <div className="mt-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Na tej stronie
            </h2>
            <ul className="mt-3 space-y-1 text-[12px] font-medium tracking-[0.01em]">
              {SECTION_LINKS.map((link) => {
                const isActive = activeSectionId === link.id;

                return (
                  <li key={link.id}>
                    <a
                      className={cn(
                        "group relative flex items-center gap-1 rounded-sm px-2 py-1.5 transition-colors",
                        isActive
                          ? "bg-foreground/5 font-semibold text-foreground before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[2px] before:rounded-full before:bg-foreground before:content-['']"
                          : "text-foreground/72 hover:bg-foreground/[0.03] hover:text-foreground"
                      )}
                      href={`#${link.id}`}
                    >
                      <ChevronRight
                        className={cn(
                          "size-3.5 transition-opacity",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        )}
                        aria-hidden
                      />
                      <span>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <div className="report-scrollbar relative pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div className="space-y-4 pt-4">
          <section className="pb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Fakty podstawowe
            </h2>
            <dl className="mt-4 space-y-2">
              <FactRow label="Gielda" value={exchange} />
              <FactRow label="Region" value={region} />
              <FactRow label="Waluta" value={metricCurrency} />
              <FactRow label="Kapitalizacja" value={marketCap} />
              <FactRow label="PE (TTM)" value={peTtm} />
              <FactRow label="Stopa dywidendy" value={dividendYield} />
              <FactRow label="Aktualizacja" value={asOf} />
            </dl>
          </section>
        </div>
      </div>
    </aside>
  );
}
