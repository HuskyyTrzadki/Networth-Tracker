import { DashboardEmptyState } from "@/features/portfolio";
export const metadata = {
  title: "Portfel",
};

export default async function PortfolioPage() {
  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Portfel</h1>
      <div className="flex flex-1 items-center justify-center py-10">
        <DashboardEmptyState
          title="Twój portfel jest pusty."
          subtitle="Dodaj swoje pierwsze aktywo, aby zobaczyć analizę."
          primaryAction={{
            label: "Dodaj transakcję",
            href: "/transactions/new",
          }}
          secondaryAction={{
            label: "Importuj CSV",
            href: "/transactions/import",
          }}
        />
      </div>
    </main>
  );
}
