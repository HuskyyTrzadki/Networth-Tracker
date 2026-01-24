"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Auth.settings");
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
      setNotice({ kind: "error", message: t("errors.google") });
    }
  };

  const startSignOut = async () => {
    setNotice(null);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        setNotice({ kind: "error", message: t("errors.signOut") });
        return;
      }
      router.refresh();
    } catch {
      setNotice({ kind: "error", message: t("errors.generic") });
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
        setNotice({ kind: "error", message: t("errors.email") });
        return;
      }

      setNotice({ kind: "success", message: t("messages.emailUpgradeOk") });
      router.refresh();
    } catch {
      setNotice({ kind: "error", message: t("errors.generic") });
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
            ? t("status.signedOut")
            : mode === "guest"
              ? t("status.guest")
              : t("status.signedIn")}
        </div>
        {userEmail ? (
          <div className="text-sm font-medium text-foreground">{userEmail}</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={startGoogleAuth}>
          {mode === "guest" ? t("actions.googleUpgrade") : t("actions.googleSignIn")}
        </Button>

        {mode === "signedOut" ? null : (
          <Button variant="secondary" onClick={startSignOut}>
            {t("actions.signOut")}
          </Button>
        )}
      </div>

      {mode === "guest" ? (
        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          <div className="text-sm font-medium">{t("email.title")}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder={t("email.emailPlaceholder")}
              inputMode="email"
              autoComplete="email"
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              placeholder={t("email.passwordPlaceholder")}
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">{t("email.hint")}</div>
            <Button variant="outline" onClick={submitEmailUpgrade}>
              {t("email.submit")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
