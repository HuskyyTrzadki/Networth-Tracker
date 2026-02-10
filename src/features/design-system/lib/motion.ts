import type { Transition, Variants } from "framer-motion";

export const MOTION_EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

export const MOTION_DURATION = {
  micro: 0.15,
  enter: 0.2,
  panel: 0.22,
} as const;

export const MOTION_TRANSITION: Transition = {
  duration: MOTION_DURATION.enter,
  ease: MOTION_EASE,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: MOTION_TRANSITION,
  },
};

export const createFadeInUp = (y = 10): Variants => ({
  hidden: { opacity: 0, y },
  visible: {
    opacity: 1,
    y: 0,
    transition: MOTION_TRANSITION,
  },
});

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};
