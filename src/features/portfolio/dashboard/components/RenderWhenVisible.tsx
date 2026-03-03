"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";

type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>;
type InViewMargin = InViewOptions["margin"];

type Props = Readonly<{
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin?: InViewMargin;
  className?: string;
}>;

const DEFAULT_ROOT_MARGIN: InViewMargin = "220px 0px";

export function RenderWhenVisible({
  children,
  fallback,
  rootMargin = DEFAULT_ROOT_MARGIN,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisible = useInView(containerRef, {
    once: true,
    margin: rootMargin,
    amount: 0.01,
  });

  return (
    <div className={className} ref={containerRef}>
      {isVisible ? children : fallback}
    </div>
  );
}
