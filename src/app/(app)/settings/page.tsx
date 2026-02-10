import { AuthSettingsSection } from "@/features/auth";

type Props = Readonly<{
  searchParams: Promise<{
    auth?: string | string[];
  }>;
}>;

export const metadata = {
  title: "Ustawienia",
};

export default async function SettingsPage({ searchParams }: Props) {
  const { auth } = await searchParams;

  const authValue = Array.isArray(auth) ? auth[0] : auth;
  const showAuthError = authValue === "error";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Ustawienia
        </h1>
        <p className="text-sm text-muted-foreground">
          Konto i logowanie
        </p>
      </header>
      <AuthSettingsSection showAuthError={showAuthError} />
    </main>
  );
}
