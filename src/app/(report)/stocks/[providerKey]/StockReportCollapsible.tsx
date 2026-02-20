"use client";

import type { PropsWithChildren } from "react";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/features/design-system/components/ui/collapsible";
import { cn } from "@/lib/utils";

type StockReportCollapsibleProps = PropsWithChildren<
  Readonly<{
    title: string;
    defaultOpen?: boolean;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
  }>
>;

export default function StockReportCollapsible({
  title,
  defaultOpen = false,
  className,
  triggerClassName,
  contentClassName,
  children,
}: StockReportCollapsibleProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={className}
      style={{ overflowAnchor: "none" }}
    >
      <CollapsibleTrigger
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between gap-3 rounded-none text-left text-base font-semibold tracking-tight transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          triggerClassName
        )}
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <span className="group-data-[state=open]:hidden">Rozwin</span>
          <span className="hidden group-data-[state=open]:inline">Zwin</span>
          <ChevronDown
            className="size-4 transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn("mt-3", contentClassName)}
        style={{ overflowAnchor: "none" }}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
