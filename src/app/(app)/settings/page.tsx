import type { Metadata } from "next";
import { newsreader } from "@/app/fonts";
import { AuthSettingsSection } from "@/features/auth/ui/AuthSettingsSection";

type Props = Readonly<{
  searchParams: Promise<{
    auth?: string | string[];
  }>;
}>;

export const metadata: Metadata = {
  title: "Ustawienia",
};

export default async function SettingsPage({ searchParams }: Props) {
  const { auth } = await searchParams;

  const authValue = Array.isArray(auth) ? auth[0] : auth;
  const showAuthError = authValue === "error";

  return (
    <main className={`mx-auto w-full max-w-4xl px-6 py-10 lg:px-8 ${newsreader.variable}`}>
      <div className="space-y-6">
        <AuthSettingsSection showAuthError={showAuthError} />
      </div>
    </main>
  );
}
