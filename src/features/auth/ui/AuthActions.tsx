"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/design-system/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

type Mode = "signedOut" | "guest" | "signedIn";

type Props = Readonly<{
  mode: Mode;
  nextPath: string;
  userEmail: string | null;
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

export function AuthActions({ mode, nextPath, userEmail }: Props) {
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
        mode === "guest"
          ? await supabase.auth.linkIdentity({
              provider: "google",
              options: { redirectTo },
            })
          : await supabase.auth.signInWithOAuth({
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
        router.refresh();
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

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {mode === "signedOut"
            ? "Wylogowano"
            : mode === "guest"
              ? "Sesja gościa"
              : "Zalogowano"}
        </div>
        {userEmail ? (
          <div className="text-sm font-medium text-foreground">{userEmail}</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={startGoogleAuth} disabled={pendingAction === "google"}>
          {mode === "guest" ? "Uaktualnij przez Google" : "Kontynuuj z Google"}
        </Button>

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

      {mode === "signedOut" ? (
        <div className="space-y-3 rounded-md border border-border bg-card p-3">
          <div className="text-sm font-medium">E-mail i hasło</div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Zaloguj</TabsTrigger>
              <TabsTrigger value="signup">Załóż konto</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.currentTarget.value)}
                  placeholder="E-mail"
                  inputMode="email"
                  autoComplete="email"
                />
                <Input
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.currentTarget.value)}
                  placeholder="Hasło"
                  type="password"
                  autoComplete="current-password"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Nie masz konta? Przełącz na rejestrację.
                </div>
                <Button
                  variant="outline"
                  onClick={submitEmailSignIn}
                  disabled={pendingAction === "signin"}
                >
                  Zaloguj się
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.currentTarget.value)}
                  placeholder="E-mail"
                  inputMode="email"
                  autoComplete="email"
                />
                <Input
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.currentTarget.value)}
                  placeholder="Hasło (min. 8 znaków)"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  W zależności od ustawień może być wymagana weryfikacja e-mail.
                </div>
                <Button
                  variant="outline"
                  onClick={submitEmailSignUp}
                  disabled={pendingAction === "signup"}
                >
                  Utwórz konto
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}

      {mode === "guest" ? (
        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          <div className="text-sm font-medium">Uaktualnij przez e-mail</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={upgradeEmail}
              onChange={(e) => setUpgradeEmail(e.currentTarget.value)}
              placeholder="E-mail"
              inputMode="email"
              autoComplete="email"
            />
            <Input
              value={upgradePassword}
              onChange={(e) => setUpgradePassword(e.currentTarget.value)}
              placeholder="Hasło (min. 8 znaków)"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              W zależności od ustawień może być wymagana weryfikacja e-mail.
            </div>
            <Button
              variant="outline"
              onClick={submitEmailUpgrade}
              disabled={pendingAction === "upgrade"}
            >
              Ustaw e-mail i hasło
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
