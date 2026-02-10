"use client";

import { motion, useReducedMotion } from "framer-motion";

import { createFadeInUp, fadeIn } from "../lib/motion";

type Props = Readonly<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}>;

export function AnimatedReveal({ children, delay = 0, y = 10, className }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? fadeIn : createFadeInUp(y);

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
