import type { Transition, Variants } from "framer-motion";

// Spring presets
export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
};

export const SPRING_DROPDOWN: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

// Stagger delay (seconds)
export const STAGGER_DELAY = 0.06;

// Fade-slide-up variants
export const FADE_SLIDE_UP: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// Page transition variants
export const PAGE_TRANSITION: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const PAGE_TRANSITION_DURATION = 0.25;

// Stagger container variants
export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_DELAY,
    },
  },
};
