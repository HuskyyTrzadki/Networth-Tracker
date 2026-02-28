import { cookies } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthLoginPanel } from "@/features/auth/ui/AuthLoginPanel";
import { Card, CardContent } from "@/features/design-system/components/ui/card";
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
        <Card className="w-full max-w-[620px] border-black/5 bg-white">
          <CardContent className="p-6">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              Obraz raportu finansowego
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Miejsce na ilustracje w stylu reportu.
            </p>
            <div className="mt-6 h-[360px] rounded-sm border border-dashed border-black/15 bg-[#f7f4ec]" />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
