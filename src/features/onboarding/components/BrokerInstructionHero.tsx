"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";

import { Card, CardContent } from "@/features/design-system/components/ui/card";

type Step = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function BrokerInstructionHero({
  title,
  description,
  steps,
  imageSrc,
}: Readonly<{
  title: string;
  description: string;
  steps: readonly Step[];
  imageSrc?: string | StaticImageData;
}>) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Instrukcja
        </p>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      </div>

      <Card className="overflow-hidden border-border/75 bg-card/95 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/20">
            {imageSrc ? (
              <div className="flex items-center justify-center bg-muted/30 px-5 py-6">
                <Image
                  src={imageSrc}
                  alt={description}
                  className="h-auto w-full max-w-[1120px] rounded-xl object-contain object-center"
                  sizes="(max-width: 1200px) 100vw, 960px"
                  priority
                />
              </div>
            ) : (
              <div className="flex min-h-[260px] items-center justify-center bg-[linear-gradient(135deg,rgba(20,20,20,0.98),rgba(12,28,37,0.98))] px-6 py-10">
                <p className="max-w-2xl text-center text-sm leading-6 text-slate-300/80">
                  {description}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={`${step.title}-${index}`}
                className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {step.eyebrow}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
