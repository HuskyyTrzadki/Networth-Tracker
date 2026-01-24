import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLocaleForMetadata, getLocaleFromParams } from "@/lib/locale";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const locale = await getLocaleForMetadata(params);
  if (!locale) return {};

  const t = await getTranslations({ locale, namespace: "Navigation.items" });
  return { title: t("search") };
}

export default async function SearchPage({ params }: Props) {
  const locale = await getLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Navigation.items" });

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("search")}</h1>
    </main>
  );
}
