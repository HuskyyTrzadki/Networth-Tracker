"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

import { cn } from "@/lib/cn";

type LinkLabelProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function LinkLabel({ children, className }: LinkLabelProps) {
  const { pending } = useLinkStatus();

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="truncate">{children}</span>
      {pending ? (
        <Loader2 className="size-3 shrink-0 animate-spin text-primary" aria-hidden />
      ) : null}
    </span>
  );
}
