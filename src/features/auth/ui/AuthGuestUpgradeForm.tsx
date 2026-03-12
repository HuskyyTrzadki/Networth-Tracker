"use client";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import { Label } from "@/features/design-system/components/ui/label";

type Props = Readonly<{
  email: string;
  password: string;
  pendingAction: "signin" | "signup" | "upgrade" | "google" | "signout" | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}>;

export function AuthGuestUpgradeForm({
  email,
  password,
  pendingAction,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border/80 bg-background/72 p-4">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Przez e-mail
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          Jeśli nie chcesz używać Google, ustaw logowanie przez e-mail i hasło.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="upgrade-email">E-mail</Label>
          <Input
            id="upgrade-email"
            value={email}
            onChange={(e) => onEmailChange(e.currentTarget.value)}
            placeholder="name@domain.com"
            inputMode="email"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="upgrade-password">Hasło</Label>
          <Input
            id="upgrade-password"
            value={password}
            onChange={(e) => onPasswordChange(e.currentTarget.value)}
            placeholder="Min. 8 znaków"
            type="password"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onSubmit}
          disabled={pendingAction === "upgrade"}
        >
          Zapisz konto przez e-mail
        </Button>
      </div>
    </div>
  );
}
