"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { AuthEmailTabs } from "./AuthEmailTabs";
import { AuthGuestUpgradeForm } from "./AuthGuestUpgradeForm";

type Mode = "signedOut" | "guest" | "signedIn";

type Props = Readonly<{
  mode: Mode;
  nextPath: string;
  userEmail: string | null;
  primaryGoogleActionLabel: string | null;
}>;

type NoticeKind = "error" | "success";

type Notice = Readonly<{
  kind: NoticeKind;
  message: string;
}>;

const buildRedirectTo = (nextPath: string) => {
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
};

export function AuthActions({
  mode,
  nextPath,
  userEmail,
  primaryGoogleActionLabel,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "signin" | "signup" | "upgrade" | "google" | "signout" | null
  >(null);

  const startGoogleAuth = async () => {
    setNotice(null);
    setPendingAction("google");
    const redirectTo = buildRedirectTo(nextPath);

    try {
      const { error } =
        mode === "signedOut"
          ? await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo },
            })
          : await supabase.auth.linkIdentity({
              provider: "google",
              options: { redirectTo },
            });

      if (error) {
        setNotice({
          kind: "error",
          message:
            "Nie udało się rozpocząć logowania przez Google. Spróbuj ponownie.",
        });
      }
    } finally {
      setPendingAction(null);
    }
  };

  const submitEmailUpgrade = async () => {
    setNotice(null);
    setPendingAction("upgrade");
    try {
      const response = await fetch("/api/auth/upgrade/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: upgradeEmail, password: upgradePassword }),
      });

      if (!response.ok) {
        setNotice({
          kind: "error",
          message:
            "Nie udało się uaktualnić przez e-mail. Sprawdź dane i spróbuj ponownie.",
        });
        return;
      }

      setNotice({
        kind: "success",
        message: "Zaktualizowano. Sprawdź skrzynkę, jeśli wymagana jest weryfikacja.",
      });
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        message: "Coś poszło nie tak. Spróbuj ponownie.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const startSignOut = async () => {
    setNotice(null);
    setPendingAction("signout");
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        setNotice({
          kind: "error",
          message: "Nie udało się wylogować. Spróbuj ponownie.",
        });
        return;
      }
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        message: "Coś poszło nie tak. Spróbuj ponownie.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const submitEmailSignIn = async () => {
    setNotice(null);
    setPendingAction("signin");
    try {
      const response = await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });

      if (!response.ok) {
        setNotice({
          kind: "error",
          message: "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.",
        });
        return;
      }

      setNotice({
        kind: "success",
        message: "Zalogowano.",
      });
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        message: "Coś poszło nie tak. Spróbuj ponownie.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const submitEmailSignUp = async () => {
    setNotice(null);
    setPendingAction("signup");
    try {
      const response = await fetch("/api/auth/signup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signUpEmail, password: signUpPassword }),
      });

      const payload = response.ok ? await response.json() : null;

      if (!response.ok) {
        setNotice({
          kind: "error",
          message:
            "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.",
        });
        return;
      }

      if (payload?.hasSession) {
        setNotice({
          kind: "success",
          message: "Konto utworzone i zalogowano.",
        });
        router.push("/onboarding");
        return;
      }

      setNotice({
        kind: "success",
        message: "Sprawdź skrzynkę, aby potwierdzić konto.",
      });
    } catch {
      setNotice({
        kind: "error",
        message: "Coś poszło nie tak. Spróbuj ponownie.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const showGoogleAction = Boolean(primaryGoogleActionLabel);
  const showGuestUpgradeForm = mode === "guest";
  const showEmailTabs = mode === "signedOut";

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap gap-2">
        {showGoogleAction ? (
          <Button onClick={startGoogleAuth} disabled={pendingAction === "google"}>
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
    </div>
  );
}
