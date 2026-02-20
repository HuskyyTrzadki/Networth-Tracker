"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

import { ReportShellMenuTrigger } from "@/features/app-shell";
import { buildRemoteImageProxyUrl } from "@/features/common/lib/remote-image";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";
import { cn } from "@/lib/cn";

import { FactRow } from "./ReportRows";

type SidebarProps = Readonly<{
  symbol: string;
  name: string;
  logoUrl: string | null;
  exchange: string;
  region: string;
  metricCurrency: string;
  marketCap: string;
  peTtm: string;
  dividendYield: string;
  asOf: string;
}>;

const SECTION_LINKS = [
  { id: "sekcja-wykres", label: "Wykres ceny" },
  { id: "sekcja-podsumowanie", label: "Najwazniejsze wnioski" },
  { id: "sekcja-fundamenty", label: "Wycena i fundamenty" },
  { id: "sekcja-jak-zarabia", label: "Jak firma zarabia" },
  { id: "sekcja-bilans", label: "Co firma posiada i co jest winna" },
  { id: "sekcja-zarzad", label: "Zarzad i insiderzy" },
  { id: "sekcja-widzety", label: "Kluczowe mini-wykresy" },
  { id: "sekcja-earnings", label: "Podsumowanie konferencji" },
] as const;

export default function StockReportSidebar({
  symbol,
  name,
  logoUrl,
  exchange,
  region,
  metricCurrency,
  marketCap,
  peTtm,
  dividendYield,
  asOf,
}: SidebarProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTION_LINKS[0].id);
  const reportImageSrc = buildRemoteImageProxyUrl(
    "https://picsum.photos/110/110?grayscale&random=97"
  );
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
    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8 lg:self-start lg:h-[calc(100dvh-4rem)] lg:border-r lg:border-dashed lg:border-black/15 lg:pr-4 lg:pt-4">
      <div className="space-y-4 bg-background">
        <section className="border-b border-dashed border-black/15 pb-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <ReportShellMenuTrigger className="px-2" />

            <div className="flex min-w-0 items-center gap-3">
              <InstrumentLogoImage src={logoUrl} size={46} fallbackText={symbol} alt={name} />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{symbol}</h1>
                <p className="truncate text-sm text-muted-foreground">{name}</p>
              </div>
            </div>

            {reportImageSrc ? (
              <Image
                src={reportImageSrc}
                alt="Ilustracja spolki"
                width={110}
                height={110}
                sizes="44px"
                className="h-auto w-[44px] rounded-none border border-dashed border-black/15 object-cover"
              />
            ) : null}
          </div>

          <div className="mt-4">
            <h2 className="text-[15px] font-semibold tracking-tight">Na tej stronie</h2>
            <ul className="mt-3 space-y-1 text-[13px] font-medium tracking-tight">
              {SECTION_LINKS.map((link) => {
                const isActive = activeSectionId === link.id;

                return (
                  <li key={link.id}>
                    <a
                      className={cn(
                        "group relative flex items-center gap-1 rounded-sm px-2 py-1.5 transition-colors",
                        isActive
                          ? "bg-foreground/5 font-semibold text-foreground before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[2px] before:rounded-full before:bg-foreground before:content-['']"
                          : "text-foreground/80 hover:text-foreground"
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
        <div className="space-y-6 pt-4">
          <section className="border-b border-dashed border-black/15 pb-6">
            <h2 className="text-[15px] font-semibold tracking-tight">Fakty podstawowe</h2>
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

          <section className="border-b border-dashed border-black/15 pb-6">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-3">
                <div className="border-b border-dashed border-black/15 pb-2">
                  <p className="text-sm text-muted-foreground">Branza</p>
                  <p className="text-sm font-bold">Internet i media spolecznosciowe</p>
                </div>
                <div className="border-b border-dashed border-black/15 pb-2">
                  <p className="text-sm text-muted-foreground">Sektor</p>
                  <p className="text-sm font-bold">Technologia</p>
                </div>
                <div className="border-b border-dashed border-black/15 pb-2">
                  <p className="text-sm text-muted-foreground">Debiut</p>
                  <p className="text-sm font-bold">18 maj 2012</p>
                </div>
                <div className="border-b border-dashed border-black/15 pb-2">
                  <p className="text-sm text-muted-foreground">Forma wejscia</p>
                  <p className="text-sm font-bold">IPO</p>
                </div>
                <div className="border-b border-dashed border-black/15 pb-2">
                  <p className="text-sm text-muted-foreground">Zatrudnienie</p>
                  <p className="text-sm font-bold">76,834</p>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-4">
            <h3 className="text-xl font-semibold tracking-tight">Ciekawostki</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              <li className="border-b border-dashed border-black/15 pb-2">
                • Ponad 98% przychodow pochodzi z reklam cyfrowych.
              </li>
              <li className="border-b border-dashed border-black/15 pb-2">
                • Segment Reality Labs nadal mocno inwestuje i obciaza marze.
              </li>
              <li className="border-b border-dashed border-black/15 pb-2">
                • Gotowka netto pozostaje wysoka mimo rosnacego capex na AI.
              </li>
              <li className="border-b border-dashed border-black/15 pb-2">
                • Wzrost EPS jest szybszy niz wzrost przychodow, co wspiera wycene.
              </li>
              <li className="pb-1">
                • Klucz do obserwacji: relacja kosztow AI do tempa monetyzacji.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </aside>
  );
}
