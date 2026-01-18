import { useTranslations } from "next-intl";

import { Container } from "@/features/common";

export function HomeHero() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Container className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
      </Container>
    </main>
  );
}
