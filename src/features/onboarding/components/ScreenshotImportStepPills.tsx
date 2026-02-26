"use client";

import { cn } from "@/lib/cn";

import type { ScreenshotImportStep, ScreenshotImportStepMeta } from "./screenshot-import-types";

export function ScreenshotImportStepPills({
  items,
  activeStep,
}: Readonly<{
  items: readonly ScreenshotImportStepMeta[];
  activeStep: ScreenshotImportStep;
}>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const isActive = item.id === activeStep;
        const isCompleted =
          items.findIndex((stepItem) => stepItem.id === activeStep) > index;
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs",
              isActive ? "bg-primary/[0.08] text-foreground" : "text-muted-foreground",
              isCompleted ? "border-primary/40" : ""
            )}
          >
            <span className="font-mono text-[11px] tabular-nums">
              {index + 1}
            </span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
