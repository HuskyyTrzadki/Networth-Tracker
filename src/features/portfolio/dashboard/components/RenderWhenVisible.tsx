"use client";

import { useInViewVisibility } from "@/features/common/hooks/use-in-view-visibility";

type Props = Readonly<{
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin?: string;
  className?: string;
}>;

const DEFAULT_ROOT_MARGIN = "220px 0px";

export function RenderWhenVisible({
  children,
  fallback,
  rootMargin = DEFAULT_ROOT_MARGIN,
  className,
}: Props) {
  const { ref: containerRef, isInView } = useInViewVisibility<HTMLDivElement>({
    rootMargin,
    once: true,
  });

  return (
    <div className={className} ref={containerRef}>
      {isInView ? children : fallback}
    </div>
  );
}
