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
    <div className="space-y-4 rounded-lg border border-border/80 bg-background/75 p-4">
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
          Ustaw e-mail i hasło
        </Button>
      </div>
    </div>
  );
}
