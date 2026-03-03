"use client";

type Props = Readonly<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}>;

export function AnimatedReveal({ children, className }: Props) {
  // Keep wrapper API stable while relying on CSS-only transitions to avoid heavy runtime motion deps.
  return <div className={className}>{children}</div>;
}
