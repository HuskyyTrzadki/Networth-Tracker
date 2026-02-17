"use client";

import { useReducer } from "react";
import Link from "next/link";
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

type State = Readonly<{
  mode: Mode;
  email: string;
  password: string;
  pendingAction: PendingAction;
  notice: Notice | null;
}>;

type Action =
  | { type: "set_mode"; payload: Mode }
  | { type: "set_email"; payload: string }
  | { type: "set_password"; payload: string }
  | { type: "set_pending_action"; payload: PendingAction }
  | { type: "set_notice"; payload: Notice | null };

const initialState: State = {
  mode: "signin",
  email: "",
  password: "",
  pendingAction: null,
  notice: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "set_mode":
      return { ...state, mode: action.payload };
    case "set_email":
      return { ...state, email: action.payload };
    case "set_password":
      return { ...state, password: action.payload };
    case "set_pending_action":
      return { ...state, pendingAction: action.payload };
    case "set_notice":
      return { ...state, notice: action.payload };
    default:
      return state;
  }
};

const buildRedirectTo = () => {
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", "/portfolio");
  return url.toString();
};

export function AuthLoginPanel() {
  const router = useRouter();
  const supabase = createClient();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { mode, email, password, pendingAction, notice } = state;

  const onGoogleSignIn = async () => {
    dispatch({ type: "set_notice", payload: null });
    dispatch({ type: "set_pending_action", payload: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: buildRedirectTo() },
    });
    if (error) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message: "Nie udalo sie uruchomic logowania Google.",
        },
      });
    }
    dispatch({ type: "set_pending_action", payload: null });
  };

  const onSubmit = async () => {
    dispatch({ type: "set_notice", payload: null });
    const action = mode === "signin" ? "signin" : "signup";
    dispatch({ type: "set_pending_action", payload: action });
    const endpoint =
      mode === "signin" ? "/api/auth/signin/email" : "/api/auth/signup/email";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (!response?.ok) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message:
            mode === "signin"
              ? "Nie udalo sie zalogowac. Sprawdz dane."
              : "Nie udalo sie utworzyc konta. Sprawdz dane.",
        },
      });
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    const payload = await response.json().catch(() => null);
    if (mode === "signin") {
      router.push("/portfolio");
      router.refresh();
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    if (payload?.hasSession) {
      router.push("/onboarding");
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    dispatch({
      type: "set_notice",
      payload: {
        kind: "success",
        message: "Sprawdz skrzynke e-mail, aby potwierdzic konto.",
      },
    });
    dispatch({ type: "set_pending_action", payload: null });
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
            onClick={() => dispatch({ type: "set_mode", payload: "signin" })}
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-semibold uppercase tracking-[0.08em]",
              mode === "signin" ? "bg-foreground text-background" : "text-foreground"
            )}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "set_mode", payload: "signup" })}
            className={cn(
              "h-8 rounded-sm px-3 text-xs font-semibold uppercase tracking-[0.08em]",
              mode === "signup" ? "bg-foreground text-background" : "text-foreground"
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
              onChange={(event) =>
                dispatch({ type: "set_email", payload: event.target.value })
              }
              placeholder="you@example.com"
            />
          </label>
          <label className="block space-y-1.5" htmlFor="auth-login-password">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Haslo
            </span>
            <Input
              id="auth-login-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) =>
                dispatch({ type: "set_password", payload: event.target.value })
              }
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
          <Link href="/terms" className="underline">
            regulamin
          </Link>{" "}
          i{" "}
          <Link href="/privacy" className="underline">
            polityke prywatnosci
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
