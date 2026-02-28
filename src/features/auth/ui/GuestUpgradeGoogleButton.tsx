"use client";

import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = Readonly<{
  nextPath: string;
}>;

const buildRedirectTo = (nextPath: string) => {
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
};

export function GuestUpgradeGoogleButton({ nextPath }: Props) {
  const supabase = createClient();
  const [pending, setPending] = useState(false);

  const startGoogleAuth = async () => {
    setPending(true);

    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: buildRedirectTo(nextPath) },
    });

    if (error) {
      setPending(false);
      return;
    }
  };

  return (
    <Button
      className="h-9 rounded-sm bg-[#1c1c1c] text-white hover:bg-[#151515]"
      disabled={pending}
      onClick={startGoogleAuth}
    >
      Uaktualnij przez Google
    </Button>
  );
}
