"use client";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import { Label } from "@/features/design-system/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/design-system/components/ui/tabs";

type Props = Readonly<{
  signInEmail: string;
  signInPassword: string;
  signUpEmail: string;
  signUpPassword: string;
  pendingAction: "signin" | "signup" | "upgrade" | "google" | "signout" | null;
  onSignInEmailChange: (value: string) => void;
  onSignInPasswordChange: (value: string) => void;
  onSignUpEmailChange: (value: string) => void;
  onSignUpPasswordChange: (value: string) => void;
  onSignInSubmit: () => void;
  onSignUpSubmit: () => void;
}>;

export function AuthEmailTabs({
  signInEmail,
  signInPassword,
  signUpEmail,
  signUpPassword,
  pendingAction,
  onSignInEmailChange,
  onSignInPasswordChange,
  onSignUpEmailChange,
  onSignUpPasswordChange,
  onSignInSubmit,
  onSignUpSubmit,
}: Props) {
  return (
    <div className="space-y-3">
      <Tabs defaultValue="signin">
        <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-0 bg-transparent p-0">
          <TabsTrigger
            value="signin"
            className="!h-auto !rounded-none !border-0 !bg-transparent !px-0 !pb-1 text-xs font-semibold uppercase tracking-[0.08em] data-[state=active]:!border-b data-[state=active]:!border-dashed data-[state=active]:!border-foreground data-[state=active]:!bg-transparent data-[state=active]:!ring-0 data-[state=active]:!shadow-none"
          >
            Zaloguj
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="!h-auto !rounded-none !border-0 !bg-transparent !px-0 !pb-1 text-xs font-semibold uppercase tracking-[0.08em] data-[state=active]:!border-b data-[state=active]:!border-dashed data-[state=active]:!border-foreground data-[state=active]:!bg-transparent data-[state=active]:!ring-0 data-[state=active]:!shadow-none"
          >
            Załóż konto
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">E-mail</Label>
              <Input
                id="signin-email"
                value={signInEmail}
                onChange={(e) => onSignInEmailChange(e.currentTarget.value)}
                placeholder="name@domain.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signin-password">Hasło</Label>
              <Input
                id="signin-password"
                value={signInPassword}
                onChange={(e) => onSignInPasswordChange(e.currentTarget.value)}
                placeholder="Twoje hasło"
                type="password"
                autoComplete="current-password"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onSignInSubmit}
              disabled={pendingAction === "signin"}
              className="h-10 min-w-32 rounded-sm"
            >
              Zaloguj
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="signup" className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">E-mail</Label>
              <Input
                id="signup-email"
                value={signUpEmail}
                onChange={(e) => onSignUpEmailChange(e.currentTarget.value)}
                placeholder="name@domain.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Hasło</Label>
              <Input
                id="signup-password"
                value={signUpPassword}
                onChange={(e) => onSignUpPasswordChange(e.currentTarget.value)}
                placeholder="Min. 8 znaków"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onSignUpSubmit}
              disabled={pendingAction === "signup"}
              className="h-10 min-w-36 rounded-sm"
            >
              Utwórz konto
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
