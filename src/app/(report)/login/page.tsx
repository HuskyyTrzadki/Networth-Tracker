import { cookies } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthLoginPanel } from "@/features/auth/ui/AuthLoginPanel";
import { PublicProductPreview } from "@/features/common/components/PublicProductPreview";
import { getAuthUser } from "@/features/auth/server/service";

export const metadata: Metadata = {
  title: "Logowanie",
};

export default async function LoginPage() {
  const user = await getAuthUser(await cookies());
  if (user && !user.is_anonymous) {
    redirect("/portfolio");
  }

  return (
    <main className="grid min-h-[calc(100dvh-140px)] items-center gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <AuthLoginPanel />

      <section className="hidden h-full items-center justify-center lg:flex">
        <PublicProductPreview
          className="w-full max-w-[720px]"
          eyebrow="Po zalogowaniu"
          title="Jedno miejsce na monitoring spółek i porządną historię portfela"
          description="Logowanie od razu otwiera raporty, pulpit portfela i dziennik transakcji. Bez osobnego panelu admina dla każdej czynności."
        />
      </section>
    </main>
  );
}
