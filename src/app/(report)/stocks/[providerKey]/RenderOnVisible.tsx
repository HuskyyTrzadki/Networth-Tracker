"use client";

import type { ReactNode } from "react";
import { useInViewVisibility } from "@/features/common/hooks/use-in-view-visibility";

type Props = Readonly<{
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
  once?: boolean;
}>;

export default function RenderOnVisible({
  children,
  fallback,
  rootMargin = "280px 0px",
  once = true,
}: Props) {
  const { ref: anchorRef, isInView } = useInViewVisibility<HTMLDivElement>({
    rootMargin,
    once,
  });

  return <div ref={anchorRef}>{isInView ? children : fallback}</div>;
}
