import { cookies } from "next/headers";

import { getAuthUser } from "@/features/auth/server/service";
import { AnimatedReveal } from "@/features/design-system";
import { cn } from "@/lib/cn";

import { AuthActions } from "./AuthActions";

type Props = Readonly<{
  showAuthError: boolean;
}>;

export async function AuthSettingsSection({ showAuthError }: Props) {
  const user = await getAuthUser(await cookies());

  const mode = !user ? "signedOut" : user.is_anonymous ? "guest" : "signedIn";
  const hasGoogleIdentity = Boolean(
    user?.identities?.some((identity) => identity.provider === "google")
  );
  const nextPath = "/settings";
  const userEmail = user?.email ?? null;
  const title = mode === "signedOut" ? "Logowanie" : "Konto";
  const subtitle =
    mode === "signedOut"
      ? "Zaloguj się, aby używać portfela na wielu urządzeniach."
      : mode === "guest"
        ? "Sesja gościa. Uaktualnij konto, aby zachować dane."
        : "Zarządzaj dostępem do konta.";
  const statusLabel = mode === "guest" ? "Sesja gościa" : "Zalogowano";
  const primaryGoogleActionLabel =
    mode === "signedOut"
      ? "Kontynuuj z Google"
      : mode === "guest"
        ? "Uaktualnij przez Google"
        : hasGoogleIdentity
          ? null
          : "Połącz z Google";

  return (
    <section className="mt-6">
      <AnimatedReveal>
        <div className="space-y-5 rounded-lg border border-border/85 bg-card/95 p-4 sm:p-6">
          <header className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </header>

          {mode === "signedOut" ? null : (
            <div className="flex items-center justify-between rounded-md border border-border/70 bg-background/80 px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">{statusLabel}</p>
              <span
                className={cn(
                  "inline-flex h-6 items-center justify-center rounded-full border px-2.5 text-xs font-medium",
                  mode === "signedIn"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
                )}
              >
                {mode === "signedIn" ? "Stałe" : "Tymczasowe"}
              </span>
            </div>
          )}

          {userEmail ? (
            <p className="font-mono text-xs text-muted-foreground tabular-nums">{userEmail}</p>
          ) : null}

          {showAuthError ? (
            <div
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground"
              role="alert"
            >
              Nie udało się dokończyć logowania. Spróbuj ponownie.
            </div>
          ) : null}

          <AuthActions
            mode={mode}
            nextPath={nextPath}
            userEmail={userEmail}
            primaryGoogleActionLabel={primaryGoogleActionLabel}
          />

          {mode === "guest" ? (
            <p className="text-xs text-muted-foreground">
              Dane gościa są usuwane po 60 dniach braku aktywności.
            </p>
          ) : null}
        </div>
      </AnimatedReveal>
    </section>
  );
}
