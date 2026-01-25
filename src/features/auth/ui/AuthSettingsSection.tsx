import { cookies } from "next/headers";

import { getAuthUser } from "@/features/auth/server/service";

import { AuthActions } from "./AuthActions";

type Props = Readonly<{
  showAuthError: boolean;
}>;

export async function AuthSettingsSection({ showAuthError }: Props) {
  const user = await getAuthUser(await cookies());

  const mode = !user ? "signedOut" : user.is_anonymous ? "guest" : "signedIn";
  const nextPath = "/settings";
  const userEmail = user?.email ?? null;

  return (
    <section className="mt-6 space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Konto</h2>
        <p className="text-sm text-muted-foreground">
          Zacznij jako gość i uaktualnij później, żeby zachować portfel.
        </p>
      </div>

      {showAuthError ? (
        <div
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          role="alert"
        >
          Nie udało się dokończyć logowania. Spróbuj ponownie.
        </div>
      ) : null}

      <AuthActions mode={mode} nextPath={nextPath} userEmail={userEmail} />

      <p className="text-xs text-muted-foreground">
        Dane gościa mogą zostać usunięte po 60 dniach braku aktywności. Uaktualnij,
        żeby je zachować.
      </p>
    </section>
  );
}
