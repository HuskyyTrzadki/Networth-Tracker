"use client";

import { useReducer } from "react";
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

type PendingAction = "signin" | "signup" | "upgrade" | "google" | "signout" | null;

type State = Readonly<{
  notice: Notice | null;
  upgradeEmail: string;
  upgradePassword: string;
  signInEmail: string;
  signInPassword: string;
  signUpEmail: string;
  signUpPassword: string;
  pendingAction: PendingAction;
}>;

type Action =
  | { type: "set_notice"; payload: Notice | null }
  | { type: "set_upgrade_email"; payload: string }
  | { type: "set_upgrade_password"; payload: string }
  | { type: "set_signin_email"; payload: string }
  | { type: "set_signin_password"; payload: string }
  | { type: "set_signup_email"; payload: string }
  | { type: "set_signup_password"; payload: string }
  | { type: "set_pending_action"; payload: PendingAction };

const initialState: State = {
  notice: null,
  upgradeEmail: "",
  upgradePassword: "",
  signInEmail: "",
  signInPassword: "",
  signUpEmail: "",
  signUpPassword: "",
  pendingAction: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "set_notice":
      return { ...state, notice: action.payload };
    case "set_upgrade_email":
      return { ...state, upgradeEmail: action.payload };
    case "set_upgrade_password":
      return { ...state, upgradePassword: action.payload };
    case "set_signin_email":
      return { ...state, signInEmail: action.payload };
    case "set_signin_password":
      return { ...state, signInPassword: action.payload };
    case "set_signup_email":
      return { ...state, signUpEmail: action.payload };
    case "set_signup_password":
      return { ...state, signUpPassword: action.payload };
    case "set_pending_action":
      return { ...state, pendingAction: action.payload };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    notice,
    upgradeEmail,
    upgradePassword,
    signInEmail,
    signInPassword,
    signUpEmail,
    signUpPassword,
    pendingAction,
  } = state;

  const startGoogleAuth = async () => {
    dispatch({ type: "set_notice", payload: null });
    dispatch({ type: "set_pending_action", payload: "google" });
    const redirectTo = buildRedirectTo(nextPath);

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
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message:
            "Nie udało się rozpocząć logowania przez Google. Spróbuj ponownie.",
        },
      });
    }

    dispatch({ type: "set_pending_action", payload: null });
  };

  const submitEmailUpgrade = async () => {
    dispatch({ type: "set_notice", payload: null });
    dispatch({ type: "set_pending_action", payload: "upgrade" });
    const response = await fetch("/api/auth/upgrade/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: upgradeEmail, password: upgradePassword }),
    }).catch(() => null);

    if (!response?.ok) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message:
            "Nie udało się uaktualnić przez e-mail. Sprawdź dane i spróbuj ponownie.",
        },
      });
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    dispatch({
      type: "set_notice",
      payload: {
        kind: "success",
        message:
          "Zaktualizowano. Sprawdź skrzynkę, jeśli wymagana jest weryfikacja.",
      },
    });
    router.refresh();
    dispatch({ type: "set_pending_action", payload: null });
  };

  const startSignOut = async () => {
    dispatch({ type: "set_notice", payload: null });
    dispatch({ type: "set_pending_action", payload: "signout" });
    const response = await fetch("/api/auth/signout", { method: "POST" }).catch(
      () => null
    );
    if (!response?.ok) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message: "Coś poszło nie tak. Spróbuj ponownie.",
        },
      });
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }
    router.refresh();
    dispatch({ type: "set_pending_action", payload: null });
  };

  const submitEmailSignIn = async () => {
    dispatch({ type: "set_notice", payload: null });
    dispatch({ type: "set_pending_action", payload: "signin" });
    const response = await fetch("/api/auth/signin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signInEmail, password: signInPassword }),
    }).catch(() => null);

    if (!response?.ok) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message: "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.",
        },
      });
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    dispatch({
      type: "set_notice",
      payload: {
        kind: "success",
        message: "Zalogowano.",
      },
    });
    router.refresh();
    dispatch({ type: "set_pending_action", payload: null });
  };

  const submitEmailSignUp = async () => {
    dispatch({ type: "set_notice", payload: null });
    dispatch({ type: "set_pending_action", payload: "signup" });
    const response = await fetch("/api/auth/signup/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signUpEmail, password: signUpPassword }),
    }).catch(() => null);

    if (!response?.ok) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "error",
          message:
            "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.",
        },
      });
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    const payload = await response.json().catch(() => null);

    if (payload?.hasSession) {
      dispatch({
        type: "set_notice",
        payload: {
          kind: "success",
          message: "Konto utworzone i zalogowano.",
        },
      });
      router.push("/onboarding");
      dispatch({ type: "set_pending_action", payload: null });
      return;
    }

    dispatch({
      type: "set_notice",
      payload: {
        kind: "success",
        message: "Sprawdź skrzynkę, aby potwierdzić konto.",
      },
    });
    dispatch({ type: "set_pending_action", payload: null });
  };

  const showGoogleAction = Boolean(primaryGoogleActionLabel);
  const showGuestUpgradeForm = mode === "guest";
  const showEmailTabs = mode === "signedOut";
  const showOauthDivider = showGoogleAction && showEmailTabs;

  return (
    <div className="max-w-xl space-y-4">
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

      <div className="flex flex-wrap items-center gap-2">
        {showGoogleAction ? (
          <Button
            onClick={startGoogleAuth}
            disabled={pendingAction === "google"}
            className="h-10 rounded-sm bg-[#1c1c1c] text-white hover:bg-[#151515]"
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

      {showOauthDivider ? (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 border-t border-dashed border-black/20" />
          lub
          <span className="h-px flex-1 border-t border-dashed border-black/20" />
        </div>
      ) : null}

      {showEmailTabs ? (
        <AuthEmailTabs
          signInEmail={signInEmail}
          signInPassword={signInPassword}
          signUpEmail={signUpEmail}
          signUpPassword={signUpPassword}
          pendingAction={pendingAction}
          onSignInEmailChange={(value) =>
            dispatch({ type: "set_signin_email", payload: value })
          }
          onSignInPasswordChange={(value) =>
            dispatch({ type: "set_signin_password", payload: value })
          }
          onSignUpEmailChange={(value) =>
            dispatch({ type: "set_signup_email", payload: value })
          }
          onSignUpPasswordChange={(value) =>
            dispatch({ type: "set_signup_password", payload: value })
          }
          onSignInSubmit={submitEmailSignIn}
          onSignUpSubmit={submitEmailSignUp}
        />
      ) : null}

      {showGuestUpgradeForm ? (
        <AuthGuestUpgradeForm
          email={upgradeEmail}
          password={upgradePassword}
          pendingAction={pendingAction}
          onEmailChange={(value) =>
            dispatch({ type: "set_upgrade_email", payload: value })
          }
          onPasswordChange={(value) =>
            dispatch({ type: "set_upgrade_password", payload: value })
          }
          onSubmit={submitEmailUpgrade}
        />
      ) : null}

      {mode === "signedIn" && userEmail ? (
        <p className="text-xs text-muted-foreground">Aktywne konto: {userEmail}</p>
      ) : null}
    </div>
  );
}
