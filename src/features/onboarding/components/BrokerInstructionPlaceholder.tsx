"use client";

import { ImageIcon } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/features/design-system/components/ui/card";

export function BrokerInstructionPlaceholder({
  eyebrow,
  title,
  description,
}: Readonly<{ eyebrow: string; title: string; description: string }>) {
  return (
    <Card className="border-border/75 bg-card/95 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/25">
          <div className="space-y-2 px-5 text-center text-muted-foreground">
            <ImageIcon className="mx-auto size-8" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-[0.14em]">
              Zrzut pomocniczy
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
