"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const startGoogleAuth = async () => {
    setNotice(null);
    const redirectTo = buildRedirectTo(nextPath);

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
        message: "Nie udało się rozpocząć logowania przez Google. Spróbuj ponownie.",
      });
    }
  };

  const startSignOut = async () => {
    setNotice(null);
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
    }
  };

  const submitEmailUpgrade = async () => {
    setNotice(null);
    try {
      const response = await fetch("/api/auth/upgrade/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
        <Button onClick={startGoogleAuth}>
          {mode === "guest" ? "Uaktualnij przez Google" : "Kontynuuj z Google"}
        </Button>

        {mode === "signedOut" ? null : (
          <Button variant="secondary" onClick={startSignOut}>
            Wyloguj
          </Button>
        )}
      </div>

      {mode === "guest" ? (
        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          <div className="text-sm font-medium">Uaktualnij przez e-mail</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="E-mail"
              inputMode="email"
              autoComplete="email"
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              placeholder="Hasło (min. 8 znaków)"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              W zależności od ustawień może być wymagana weryfikacja e-mail.
            </div>
            <Button variant="outline" onClick={submitEmailUpgrade}>
              Ustaw e-mail i hasło
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
