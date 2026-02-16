"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";
type PendingAction = "google" | "signin" | "signup" | null;

type Notice = Readonly<{
  kind: "error" | "success";
  message: string;
}>;

const buildRedirectTo = () => {
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", "/portfolio");
  return url.toString();
};

export function AuthLoginPanel() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const onGoogleSignIn = async () => {
    setNotice(null);
    setPendingAction("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: buildRedirectTo() },
      });
      if (error) {
        setNotice({
          kind: "error",
          message: "Nie udalo sie uruchomic logowania Google.",
        });
      }
    } finally {
      setPendingAction(null);
    }
  };

  const onSubmit = async () => {
    setNotice(null);
    const action = mode === "signin" ? "signin" : "signup";
    setPendingAction(action);
    try {
      const endpoint =
        mode === "signin" ? "/api/auth/signin/email" : "/api/auth/signup/email";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = response.ok ? await response.json().catch(() => null) : null;
      if (!response.ok) {
        setNotice({
          kind: "error",
          message:
            mode === "signin"
              ? "Nie udalo sie zalogowac. Sprawdz dane."
              : "Nie udalo sie utworzyc konta. Sprawdz dane.",
        });
        return;
      }

      if (mode === "signin") {
        router.push("/portfolio");
        router.refresh();
        return;
      }

      if (payload?.hasSession) {
        router.push("/onboarding");
        return;
      }

      setNotice({
        kind: "success",
        message: "Sprawdz skrzynke e-mail, aby potwierdzic konto.",
      });
    } catch {
      setNotice({
        kind: "error",
        message: "Cos poszlo nie tak. Sprobuj ponownie.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[460px] rounded-md border border-dashed border-border/90 bg-card/70 p-5 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Logowanie</h1>
        <p className="text-sm text-muted-foreground">
          Zaloguj sie, aby korzystac z raportow i portfolio na wielu urzadzeniach.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <Button
          onClick={onGoogleSignIn}
          disabled={pendingAction === "google"}
          className="h-11 w-full justify-center text-sm"
          variant="outline"
        >
          Kontynuuj z Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 border-t border-dashed border-border/70" />
          albo
          <span className="h-px flex-1 border-t border-dashed border-border/70" />
        </div>

        <div className="inline-flex rounded-md border border-border/85 p-0.5">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-semibold uppercase tracking-[0.08em]",
              mode === "signin" ? "bg-foreground text-background" : "text-foreground"
            )}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-semibold uppercase tracking-[0.08em]",
              mode === "signup" ? "bg-foreground text-background" : "text-foreground"
            )}
          >
            Rejestracja
          </button>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              E-mail
            </span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Haslo
            </span>
            <Input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 znakow"
            />
          </label>
          <Button
            className="h-11 w-full text-sm"
            onClick={onSubmit}
            disabled={pendingAction === "signin" || pendingAction === "signup"}
          >
            {mode === "signin" ? "Zaloguj" : "Utworz konto"}
          </Button>
        </div>

        {notice ? (
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              notice.kind === "error"
                ? "border-destructive/50 text-destructive"
                : "border-profit/60 text-profit"
            )}
          >
            {notice.message}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Kontynuujac, akceptujesz{" "}
          <a href="#" className="underline">
            regulamin
          </a>{" "}
          i{" "}
          <a href="#" className="underline">
            polityke prywatnosci
          </a>
          .
        </p>
      </div>
    </section>
  );
}
