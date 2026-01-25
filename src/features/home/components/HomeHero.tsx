"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/features/design-system/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function HomeHero() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const router = useRouter();

  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const startGuest = async () => {
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/anonymous", { method: "POST" });
      if (!response.ok) {
        setNotice(t("cta.error"));
        return;
      }

      router.replace("/search", { locale });
    } catch {
      setNotice(t("cta.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-10">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          {t("brand")}
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {t("heading")}
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                {t("subtitle")}
              </p>
            </div>

            <div className="mt-8 max-w-2xl space-y-3">
              <Button
                size="lg"
                className="h-11 w-full px-6 sm:w-auto"
                onClick={startGuest}
                disabled={pending}
                aria-busy={pending}
              >
                {t("cta.guest")}
              </Button>

              <p className="text-sm text-muted-foreground">{t("cta.hint")}</p>

              {notice ? (
                <div
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  role="alert"
                >
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="text-sm font-semibold tracking-tight">
                  {t("highlights.delayed.title")}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("highlights.delayed.body")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="text-sm font-semibold tracking-tight">
                  {t("highlights.fx.title")}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("highlights.fx.body")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="text-sm font-semibold tracking-tight">
                  {t("highlights.cache.title")}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("highlights.cache.body")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 text-xs text-muted-foreground">
          {t("footnote")}
        </div>
      </div>
    </main>
  );
}
