import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { getAuthUser } from "@/features/auth/server/service";
import { redirect } from "@/i18n/navigation";
import { getLocaleForMetadata, getLocaleFromParams } from "@/lib/locale";
import { HomeHero } from "@/features/home";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const locale = await getLocaleForMetadata(params);
  if (!locale) return {};

  const t = await getTranslations({ locale, namespace: "HomePage.metadata" });
  return { title: t("title") };
}

export default async function Home({ params }: Props) {
  const locale = await getLocaleFromParams(params);

  const user = await getAuthUser(await cookies());
  if (user) {
    redirect({ href: "/search", locale });
  }

  return <HomeHero />;
}
