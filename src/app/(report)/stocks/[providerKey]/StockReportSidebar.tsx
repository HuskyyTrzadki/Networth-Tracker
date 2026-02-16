import Image from "next/image";

import { ReportShellMenuTrigger } from "@/features/app-shell";
import { InstrumentLogoImage } from "@/features/transactions/components/InstrumentLogoImage";

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
  return (
    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-14 lg:h-[calc(100dvh-4rem)] lg:border-r lg:border-dashed lg:border-[color:var(--report-rule)] lg:pr-4 lg:pt-4">
      <div className="space-y-4 bg-background">
        <section className="border-b border-dashed border-[color:var(--report-rule)] pb-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <ReportShellMenuTrigger className="px-2" />

            <div className="flex min-w-0 items-center gap-3">
              <InstrumentLogoImage src={logoUrl} size={46} fallbackText={symbol} alt={name} />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{symbol}</h1>
                <p className="truncate text-sm text-muted-foreground">{name}</p>
              </div>
            </div>

            <Image
              src="https://picsum.photos/110/110?grayscale&random=97"
              alt="Ilustracja spolki"
              width={110}
              height={110}
              className="h-auto w-[44px] rounded-sm border border-dashed border-[color:var(--report-rule)] object-cover"
            />
          </div>

          <div className="mt-4">
            <h2 className="text-[15px] font-semibold tracking-tight">Na tej stronie</h2>
            <ul className="mt-3 space-y-1 text-[13px] font-medium tracking-tight text-foreground/80">
              <li>
                <a className="hover:text-foreground" href="#sekcja-wykres">
                  Wykres ceny
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-podsumowanie">
                  Najwazniejsze wnioski
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-fundamenty">
                  Wycena i fundamenty
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-jak-zarabia">
                  Jak firma zarabia
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-bilans">
                  Co firma posiada i co jest winna
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-zarzad">
                  Zarzad i insiderzy
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-widzety">
                  Kluczowe mini-wykresy
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="#sekcja-earnings">
                  Podsumowanie konferencji
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className="report-scrollbar relative pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div className="space-y-6 pt-4">
          <section className="border-b border-dashed border-[color:var(--report-rule)] pb-6">
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

          <section className="border-b border-dashed border-[color:var(--report-rule)] pb-6">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-3">
                <div className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                  <p className="text-sm text-muted-foreground">Branza</p>
                  <p className="text-sm font-bold">Internet i media spolecznosciowe</p>
                </div>
                <div className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                  <p className="text-sm text-muted-foreground">Sektor</p>
                  <p className="text-sm font-bold">Technologia</p>
                </div>
                <div className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                  <p className="text-sm text-muted-foreground">Debiut</p>
                  <p className="text-sm font-bold">18 maj 2012</p>
                </div>
                <div className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                  <p className="text-sm text-muted-foreground">Forma wejscia</p>
                  <p className="text-sm font-bold">IPO</p>
                </div>
                <div className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                  <p className="text-sm text-muted-foreground">Zatrudnienie</p>
                  <p className="text-sm font-bold">76,834</p>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-4">
            <h3 className="text-xl font-semibold tracking-tight">Ciekawostki</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              <li className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                • Ponad 98% przychodow pochodzi z reklam cyfrowych.
              </li>
              <li className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                • Segment Reality Labs nadal mocno inwestuje i obciaza marze.
              </li>
              <li className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                • Gotowka netto pozostaje wysoka mimo rosnacego capex na AI.
              </li>
              <li className="border-b border-dashed border-[color:var(--report-rule)] pb-2">
                • Wzrost EPS jest szybszy niz wzrost przychodow, co wspiera wycene.
              </li>
              <li className="pb-1">
                • Klucz do obserwacji: relacja kosztow AI do tempa monetyzacji.
              </li>
            </ul>
          </section>
        </div>
        <div className="pointer-events-none sticky bottom-0 z-10 -mx-1 hidden h-8 bg-gradient-to-t from-background via-background/90 to-transparent lg:block" />
      </div>
    </aside>
  );
}
