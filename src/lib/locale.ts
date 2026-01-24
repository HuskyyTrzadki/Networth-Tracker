import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { isLocale, type Locale } from "@/i18n/routing";

type LocaleParams = Readonly<{
  locale: string;
}>;

export async function getLocaleFromParams(
  params: Promise<LocaleParams>
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  return locale;
}

export async function getLocaleForMetadata(
  params: Promise<LocaleParams>
): Promise<Locale | null> {
  const { locale } = await params;
  return isLocale(locale) ? locale : null;
}
