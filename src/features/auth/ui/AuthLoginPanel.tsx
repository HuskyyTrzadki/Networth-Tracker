"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  readAuthErrorMessage,
  signInWithEmail,
  signUpWithEmail,
  startGoogleSignIn,
} from "@/features/auth/client/auth-api";
import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import { Card, CardContent } from "@/features/design-system/components/ui/card";
import { cn } from "@/lib/cn";
import { useAuthActionState } from "./use-auth-action-state";

type Mode = "signin" | "signup";
type PendingAction = "google" | "signin" | "signup";

export function AuthLoginPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { notice, pendingAction, runWithPending, setErrorNotice, setSuccessNotice } =
    useAuthActionState<PendingAction>();

  const onGoogleSignIn = async () => {
    await runWithPending({
      pendingAction: "google",
      run: async () => {
        const redirectUrl = await startGoogleSignIn("/portfolio");
        window.location.assign(redirectUrl);
      },
      onError: () => setErrorNotice("Nie udało się uruchomić logowania przez Google."),
    });
  };

  const onSubmit = async () => {
    const action = mode === "signin" ? "signin" : "signup";
    await runWithPending({
      pendingAction: action,
      run: async () => {
        if (mode === "signin") {
          await signInWithEmail({ email, password });
          return { mode: "signin" as const, hasSession: true };
        }

        const result = await signUpWithEmail({ email, password });
        return { mode: "signup" as const, hasSession: result.hasSession };
      },
      onSuccess: (result) => {
        if (result.mode === "signin") {
          router.push("/portfolio");
          router.refresh();
          return;
        }

        if (result.hasSession) {
          router.push("/onboarding");
          return;
        }

        setSuccessNotice("Sprawdź skrzynkę e-mail, aby potwierdzić konto.");
      },
      onError: (error) => {
        const message = readAuthErrorMessage(
          error,
          mode === "signin"
            ? "Nie udało się zalogować. Sprawdź dane."
            : "Nie udało się utworzyć konta. Sprawdź dane."
        );
        setErrorNotice(message);
      },
    });
  };

  return (
    <Card className="mx-auto w-full max-w-[560px] border-black/5 bg-white">
      <CardContent className="p-6 sm:p-7">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
            Logowanie
          </h1>
          <p className="text-sm text-muted-foreground">
            Dostęp do portfela i raportów.
          </p>
        </div>

        <div className="mt-6 max-w-md space-y-4">
          <Button
            onClick={onGoogleSignIn}
            disabled={pendingAction === "google"}
            className="h-11 w-full justify-center rounded-sm text-sm"
            variant="outline"
          >
            Kontynuuj z Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 border-t border-dashed border-border/70" />
            albo
            <span className="h-px flex-1 border-t border-dashed border-border/70" />
          </div>

          <div className="inline-flex items-center gap-5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "border-b border-transparent pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/80 transition-colors",
                mode === "signin"
                  ? "border-dashed border-foreground text-foreground"
                  : "hover:text-foreground"
              )}
            >
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "border-b border-transparent pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/80 transition-colors",
                mode === "signup"
                  ? "border-dashed border-foreground text-foreground"
                  : "hover:text-foreground"
              )}
            >
              Rejestracja
            </button>
          </div>

          <div className="space-y-3">
            <label className="block space-y-1.5" htmlFor="auth-login-email">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                E-mail
              </span>
              <Input
                id="auth-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="block space-y-1.5" htmlFor="auth-login-password">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Hasło
              </span>
              <Input
                id="auth-login-password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 znaków"
              />
            </label>
            <Button
              className="h-11 w-full rounded-sm bg-[#1c1c1c] text-sm text-white hover:bg-[#151515]"
              onClick={onSubmit}
              disabled={pendingAction === "signin" || pendingAction === "signup"}
            >
              {mode === "signin" ? "Zaloguj się" : "Utwórz konto"}
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
            Kontynuując, akceptujesz{" "}
            <Link href="/terms" className="underline">
              regulamin
            </Link>{" "}
            i{" "}
            <Link href="/privacy" className="underline">
              politykę prywatności
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
