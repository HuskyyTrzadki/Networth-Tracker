"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import {
  readAuthErrorMessage,
  signInWithEmail,
  signOutSession,
  signUpWithEmail,
  startGoogleLink,
  startGoogleSignIn,
  upgradeWithEmail,
} from "@/features/auth/client/auth-api";
import { cn } from "@/lib/cn";
import { AuthEmailTabs } from "./AuthEmailTabs";
import { AuthGuestUpgradeForm } from "./AuthGuestUpgradeForm";
import { useAuthActionState } from "./use-auth-action-state";

type Mode = "signedOut" | "guest" | "signedIn";

type Props = Readonly<{
  mode: Mode;
  nextPath: string;
  userEmail: string | null;
  primaryGoogleActionLabel: string | null;
}>;

type PendingAction = "signin" | "signup" | "upgrade" | "google" | "signout";

export function AuthActions({
  mode,
  nextPath,
  userEmail,
  primaryGoogleActionLabel,
}: Props) {
  const router = useRouter();
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const { notice, pendingAction, runWithPending, setErrorNotice, setSuccessNotice } =
    useAuthActionState<PendingAction>();

  const startGoogleAuth = async () => {
    await runWithPending({
      pendingAction: "google",
      run: async () => {
        const redirectUrl =
          mode === "signedOut"
            ? await startGoogleSignIn(nextPath)
            : await startGoogleLink(nextPath);
        window.location.assign(redirectUrl);
      },
      onError: () =>
        setErrorNotice(
          "Nie udało się rozpocząć logowania przez Google. Spróbuj ponownie."
        ),
    });
  };

  const submitEmailUpgrade = async () => {
    await runWithPending({
      pendingAction: "upgrade",
      run: () => upgradeWithEmail({ email: upgradeEmail, password: upgradePassword }),
      onSuccess: () => {
        setSuccessNotice(
          "Zaktualizowano. Sprawdź skrzynkę, jeśli wymagana jest weryfikacja."
        );
        router.refresh();
      },
      onError: (error) =>
        setErrorNotice(
          readAuthErrorMessage(
            error,
            "Nie udało się uaktualnić przez e-mail. Sprawdź dane i spróbuj ponownie."
          )
        ),
    });
  };

  const startSignOut = async () => {
    await runWithPending({
      pendingAction: "signout",
      run: signOutSession,
      onSuccess: () => {
        router.refresh();
      },
      onError: (error) =>
        setErrorNotice(readAuthErrorMessage(error, "Coś poszło nie tak. Spróbuj ponownie.")),
    });
  };

  const submitEmailSignIn = async () => {
    await runWithPending({
      pendingAction: "signin",
      run: () => signInWithEmail({ email: signInEmail, password: signInPassword }),
      onSuccess: () => {
        setSuccessNotice("Zalogowano.");
        router.refresh();
      },
      onError: (error) =>
        setErrorNotice(
          readAuthErrorMessage(
            error,
            "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie."
          )
        ),
    });
  };

  const submitEmailSignUp = async () => {
    await runWithPending({
      pendingAction: "signup",
      run: () =>
        signUpWithEmail({
          email: signUpEmail,
          password: signUpPassword,
        }),
      onSuccess: (result) => {
        if (result.hasSession) {
          setSuccessNotice("Konto utworzone i zalogowano.");
          router.push("/onboarding");
          return;
        }
        setSuccessNotice("Sprawdź skrzynkę, aby potwierdzić konto.");
      },
      onError: (error) =>
        setErrorNotice(
          readAuthErrorMessage(
            error,
            "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie."
          )
        ),
    });
  };

  const showGoogleAction = Boolean(primaryGoogleActionLabel);
  const showGuestUpgradeForm = mode === "guest";
  const showEmailTabs = mode === "signedOut";
  const showOauthDivider = showGoogleAction && showEmailTabs;
  return (
    <div className="max-w-2xl space-y-4">
      {notice ? (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            notice.kind === "error"
              ? "border-destructive/35 bg-destructive/5 text-foreground"
              : "border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
          )}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      ) : null}

      {mode === "guest" ? null : (
        <div className="flex flex-wrap items-center gap-2.5">
          {showGoogleAction ? (
            <Button
              onClick={startGoogleAuth}
              disabled={pendingAction === "google"}
              className="h-10 rounded-sm"
            >
              {primaryGoogleActionLabel}
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Google połączone
            </Button>
          )}

          {mode === "signedOut" ? null : (
            <Button
              variant="secondary"
              onClick={startSignOut}
              disabled={pendingAction === "signout"}
            >
              Wyloguj
            </Button>
          )}
        </div>
      )}

      {mode === "guest" ? (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 border-t border-dashed border-border/70" />
          albo użyj e-maila
          <span className="h-px flex-1 border-t border-dashed border-border/70" />
        </div>
      ) : null}

      {showOauthDivider ? (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 border-t border-dashed border-border/70" />
          lub
          <span className="h-px flex-1 border-t border-dashed border-border/70" />
        </div>
      ) : null}

      {showEmailTabs ? (
        <AuthEmailTabs
          signInEmail={signInEmail}
          signInPassword={signInPassword}
          signUpEmail={signUpEmail}
          signUpPassword={signUpPassword}
          pendingAction={pendingAction}
          onSignInEmailChange={setSignInEmail}
          onSignInPasswordChange={setSignInPassword}
          onSignUpEmailChange={setSignUpEmail}
          onSignUpPasswordChange={setSignUpPassword}
          onSignInSubmit={submitEmailSignIn}
          onSignUpSubmit={submitEmailSignUp}
        />
      ) : null}

      {showGuestUpgradeForm ? (
        <AuthGuestUpgradeForm
          email={upgradeEmail}
          password={upgradePassword}
          pendingAction={pendingAction}
          onEmailChange={setUpgradeEmail}
          onPasswordChange={setUpgradePassword}
          onSubmit={submitEmailUpgrade}
        />
      ) : null}

      {mode === "signedIn" && userEmail ? (
        <p className="text-xs text-muted-foreground">Aktywne konto: {userEmail}</p>
      ) : null}

      {mode === "guest" ? (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            className="h-auto px-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={startSignOut}
            disabled={pendingAction === "signout"}
          >
            Wyloguj z sesji gościa
          </Button>
        </div>
      ) : null}
    </div>
  );
}
