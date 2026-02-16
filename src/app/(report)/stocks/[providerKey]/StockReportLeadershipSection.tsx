const LEADERSHIP_CARDS = [
  {
    name: "Mark Zuckerberg",
    role: "CEO",
    tenure: "od 2004",
    alignment: "Wysokie",
    note: "Konsekwentnie utrzymuje kontrole strategiczna i dlugi horyzont inwestycyjny.",
  },
  {
    name: "Susan Li",
    role: "CFO",
    tenure: "od 2022",
    alignment: "Umiarkowane",
    note: "Dyscyplina kosztowa i kontrola capex sa podkreslane w komunikacji kwartalnej.",
  },
  {
    name: "Chris Cox",
    role: "CPO",
    tenure: "od 2005",
    alignment: "Wysokie",
    note: "Odpowiada za roadmape produktowa i tempo wdrozen AI w glownych aplikacjach.",
  },
] as const;

const INSIDER_TIMELINE = [
  {
    date: "05 sty 2026",
    person: "CFO",
    action: "Kupno",
    volume: "18,400 akcji",
    value: "$11.2M",
    implication: "Sygnal wiary w utrzymanie marz po wysokim capex.",
  },
  {
    date: "22 lis 2025",
    person: "CEO",
    action: "Sprzedaz",
    volume: "62,000 akcji",
    value: "$38.5M",
    implication: "Sprzedaz planowa; brak zmiany dlugoterminowego udzialu kontrolnego.",
  },
  {
    date: "03 wrz 2025",
    person: "CTO",
    action: "Kupno",
    volume: "9,700 akcji",
    value: "$5.6M",
    implication: "Wzmocnienie pozycji po korekcie kursu i przed cyklem produktowym.",
  },
] as const;

export default function StockReportLeadershipSection() {
  return (
    <section id="sekcja-zarzad" className="space-y-3 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">Kto steruje statkiem</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil zarzadu i aktywnosc insiderow pomagaja ocenic jakosc decyzji w dlugim terminie.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {LEADERSHIP_CARDS.map((leader) => (
          <article
            key={leader.name}
            className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3"
          >
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {leader.role}
            </p>
            <h4 className="mt-1 text-base font-semibold tracking-tight">{leader.name}</h4>
            <p className="mt-2 text-xs text-muted-foreground">Staz: {leader.tenure}</p>
            <p className="mt-1 font-mono text-xs text-foreground">
              Zgodnosc z akcjonariuszami: {leader.alignment}
            </p>
            <p className="mt-2 text-sm text-foreground/90">{leader.note}</p>
          </article>
        ))}
      </div>

      <article className="rounded-sm border border-dashed border-[color:var(--report-rule)] p-3">
        <h4 className="text-base font-semibold tracking-tight">Insiderzy na osi czasu</h4>
        <ol className="mt-3 space-y-2">
          {INSIDER_TIMELINE.map((item) => (
            <li
              key={`${item.date}-${item.person}-${item.action}`}
              className="grid gap-2 border-b border-dashed border-[color:var(--report-rule)] pb-2 last:border-b-0 last:pb-0 md:grid-cols-[120px_minmax(0,1fr)]"
            >
              <p className="font-mono text-[11px] text-muted-foreground">{item.date}</p>
              <div className="space-y-0.5">
                <p className="text-sm">
                  <span className="font-semibold">{item.person}</span> -{" "}
                  <span
                    className={
                      item.action === "Kupno"
                        ? "font-semibold text-profit"
                        : "font-semibold text-loss"
                    }
                  >
                    {item.action}
                  </span>{" "}
                  <span className="font-mono text-[12px]">{item.volume}</span>{" "}
                  <span className="font-mono text-[12px] text-muted-foreground">
                    ({item.value})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{item.implication}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Dane demonstracyjne do czasu podlaczenia feedu insider transactions.
        </p>
      </article>
    </section>
  );
}

