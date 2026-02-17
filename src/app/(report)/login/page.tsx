import { cookies } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthLoginPanel } from "@/features/auth/ui/AuthLoginPanel";
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
        <div className="w-full max-w-[620px] rounded-md border border-dashed border-border/85 bg-card/55 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Slot ilustracji
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Obraz raportu finansowego
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Wstaw tutaj wygenerowana ilustracje AI w stylu grawiury
            (astronauta/ledger/newspaper), aby uzyskac pelny StockTaper feel.
          </p>
          <div className="mt-6 h-[360px] rounded-md border border-dashed border-border/80 bg-background/60" />
        </div>
      </section>
    </main>
  );
}
