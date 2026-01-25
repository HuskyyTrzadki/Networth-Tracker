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
    <main className="px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
      <AuthSettingsSection showAuthError={showAuthError} />
    </main>
  );
}
