"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useInView } from "framer-motion";

type UseInViewOptions = NonNullable<Parameters<typeof useInView>[1]>;
type InViewMargin = UseInViewOptions["margin"];

type Props = Readonly<{
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: InViewMargin;
  once?: boolean;
}>;

export default function RenderOnVisible({
  children,
  fallback,
  rootMargin = "280px 0px",
  once = true,
}: Props) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const isVisible = useInView(anchorRef, {
    once,
    margin: rootMargin,
    amount: 0.01,
  });

  return <div ref={anchorRef}>{isVisible ? children : fallback}</div>;
}
