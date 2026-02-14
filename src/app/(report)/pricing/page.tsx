export const metadata = {
  title: "Cennik",
};

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6">
      <header className="border-b border-dashed border-border/90 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Oferta
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cennik</h1>
      </header>
      <section className="rounded-md border border-dashed border-border/90 bg-card/70 p-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Strona cennika zostanie uzupelniona w kolejnym etapie redesignu.
        </p>
      </section>
    </main>
  );
}
