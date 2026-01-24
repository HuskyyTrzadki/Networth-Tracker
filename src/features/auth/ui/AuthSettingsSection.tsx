import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { getAuthUser } from "@/features/auth/server/service";
import type { Locale } from "@/i18n/routing";

import { AuthActions } from "./AuthActions";

type Props = Readonly<{
  locale: Locale;
  showAuthError: boolean;
}>;

export async function AuthSettingsSection({ locale, showAuthError }: Props) {
  const t = await getTranslations({ locale, namespace: "Auth.settings" });
  const user = await getAuthUser(await cookies());

  const mode = !user ? "signedOut" : user.is_anonymous ? "guest" : "signedIn";
  const nextPath = locale === "en" ? "/en/settings" : "/settings";
  const userEmail = user?.email ?? null;

  return (
    <section className="mt-6 space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {showAuthError ? (
        <div
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          role="alert"
        >
          {t("messages.oauthError")}
        </div>
      ) : null}

      <AuthActions mode={mode} nextPath={nextPath} userEmail={userEmail} />

      <p className="text-xs text-muted-foreground">{t("retentionHint")}</p>
    </section>
  );
}
