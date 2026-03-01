import { cookies } from "next/headers";
import { AlertTriangle } from "lucide-react";

import { getAuthUser } from "@/features/auth/server/service";
import { isDemoAccount } from "@/features/auth/server/demo-account";
import { AnimatedReveal } from "@/features/design-system";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/features/design-system/components/ui/alert";
import { Card, CardContent } from "@/features/design-system/components/ui/card";
import { cn } from "@/lib/cn";

import { AuthActions } from "./AuthActions";
import { GuestUpgradeGoogleButton } from "./GuestUpgradeGoogleButton";
import { StartRealPortfolioButton } from "./StartRealPortfolioButton";

type Props = Readonly<{
  showAuthError: boolean;
}>;

export async function AuthSettingsSection({ showAuthError }: Props) {
  const cookieStore = await cookies();
  const user = await getAuthUser(cookieStore);
  const demoGuest = user?.is_anonymous
    ? await isDemoAccount(user.id).catch(() => false)
    : false;

  const mode = !user ? "signedOut" : user.is_anonymous ? "guest" : "signedIn";
  const hasGoogleIdentity = Boolean(
    user?.identities?.some((identity) => identity.provider === "google")
  );
  const nextPath = "/settings";
  const userEmail = user?.email ?? null;
  const title = mode === "signedOut" ? "Logowanie" : "Konto";
  const subtitle =
    mode === "signedOut"
      ? "Zaloguj się, aby wrócić do portfela."
      : mode === "guest"
        ? demoGuest
          ? "To konto pokazuje demo. Następny krok to uruchomić własny portfel."
          : "Uaktualnij konto, aby zachować dane."
        : "Zarządzaj dostępem.";
  const statusLabel = mode === "guest" ? "Sesja gościa" : "Zalogowano";
  const primaryGoogleActionLabel =
    mode === "signedOut"
      ? "Kontynuuj z Google"
      : mode === "guest"
        ? demoGuest
          ? null
          : "Uaktualnij przez Google"
        : hasGoogleIdentity
          ? null
          : "Połącz z Google";

  return (
    <section>
      <AnimatedReveal>
        <Card className="border-black/8 bg-white shadow-[var(--surface-shadow)]">
          <CardContent className="space-y-5 p-6 sm:p-7">
            <header className="space-y-2">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </header>

            {mode === "guest" ? (
              <Alert className="border-amber-300/70 bg-amber-50/65 px-4 py-4 text-foreground shadow-none">
                <AlertTriangle className="mt-0.5 mb-0.5 size-4 text-amber-700" aria-hidden="true" />
                <div className="space-y-3">
                  <AlertTitle className="text-sm font-semibold text-amber-950">
                    {demoGuest ? "Tryb demo" : "Konto gościa jest tymczasowe"}
                  </AlertTitle>
                  <AlertDescription className="text-sm leading-6 text-amber-900/85">
                    {demoGuest
                      ? "To konto zawiera przykładowe dane demonstracyjne. Wróć do onboardingu, aby zacząć od własnego portfela i własnej historii."
                      : "Uaktualnij konto, aby nie stracić danych."}
                  </AlertDescription>
                  {demoGuest ? (
                    <div>
                      <StartRealPortfolioButton className="h-9 rounded-md bg-black px-4 text-white hover:bg-black/90" />
                    </div>
                  ) : (
                    <div>
                      <GuestUpgradeGoogleButton nextPath={nextPath} />
                    </div>
                  )}
                </div>
              </Alert>
            ) : null}

            {mode === "signedOut" || mode === "guest" ? null : (
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
                className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground"
                role="alert"
              >
                Nie udało się dokończyć logowania. Spróbuj ponownie.
              </div>
            ) : null}

            {demoGuest && mode === "guest" ? null : (
              <AuthActions
                mode={mode}
                nextPath={nextPath}
                userEmail={userEmail}
                primaryGoogleActionLabel={primaryGoogleActionLabel}
              />
            )}
          </CardContent>
        </Card>
      </AnimatedReveal>
    </section>
  );
}
