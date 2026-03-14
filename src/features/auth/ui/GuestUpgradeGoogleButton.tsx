"use client";

import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { readAuthErrorMessage, startGoogleLink } from "@/features/auth/client/auth-api";

type Props = Readonly<{
  nextPath: string;
}>;

export function GuestUpgradeGoogleButton({ nextPath }: Props) {
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startGoogleAuth = async () => {
    setErrorMessage(null);
    setPending(true);
    try {
      const redirectUrl = await startGoogleLink(nextPath);
      window.location.assign(redirectUrl);
    } catch (error) {
      setErrorMessage(
        readAuthErrorMessage(
          error,
          "Nie udało się rozpocząć łączenia konta Google. Spróbuj ponownie."
        )
      );
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        className="h-9 rounded-sm"
        disabled={pending}
        onClick={startGoogleAuth}
      >
        Uaktualnij przez Google
      </Button>
      {errorMessage ? (
        <p className="text-xs text-[color:var(--loss)]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
