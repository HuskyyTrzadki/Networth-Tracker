import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DashboardEmptyState } from "@/features/portfolio";
import { getLocaleForMetadata, getLocaleFromParams } from "@/lib/locale";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const locale = await getLocaleForMetadata(params);
  if (!locale) return {};

  const nav = await getTranslations({ locale, namespace: "Navigation.items" });
  return { title: nav("portfolio") };
}

export default async function PortfolioPage({ params }: Props) {
  const locale = await getLocaleFromParams(params);
  const nav = await getTranslations({ locale, namespace: "Navigation.items" });
  const emptyState = await getTranslations({
    locale,
    namespace: "PortfolioPage.empty",
  });

  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {nav("portfolio")}
      </h1>
      <div className="flex flex-1 items-center justify-center py-10">
        <DashboardEmptyState
          title={emptyState("title")}
          subtitle={emptyState("subtitle")}
          primaryAction={{
            label: emptyState("actions.addTransaction"),
            href: "/transactions/new",
          }}
          secondaryAction={{
            label: emptyState("actions.importCsv"),
            href: "/transactions/new?import=csv",
          }}
        />
      </div>
    </main>
  );
}
