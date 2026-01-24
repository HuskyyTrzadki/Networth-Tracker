import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthSettingsSection } from "@/features/auth";
import { isLocale } from "@/i18n/routing";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    auth?: string | string[];
  }>;
}>;

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "Navigation.items" });
  return { title: t("settings") };
}

export default async function SettingsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Navigation.items" });
  const { auth } = await searchParams;

  const authValue = Array.isArray(auth) ? auth[0] : auth;
  const showAuthError = authValue === "error";

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("settings")}</h1>
      <AuthSettingsSection locale={locale} showAuthError={showAuthError} />
    </main>
  );
}
