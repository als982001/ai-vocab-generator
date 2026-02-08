import type { ReactNode } from "react";

import { motion } from "framer-motion";
import {
  FADE_SLIDE_UP,
  SPRING_GENTLE,
  STAGGER_CONTAINER,
} from "~/utils/animation";

interface IAnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: IAnimatedListProps) {
  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface IAnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({
  children,
  className,
}: IAnimatedListItemProps) {
  return (
    <motion.div
      variants={FADE_SLIDE_UP}
      transition={SPRING_GENTLE}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface IAnimatedViewportItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedViewportItem({
  children,
  className,
}: IAnimatedViewportItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={SPRING_GENTLE}
      className={className}
    >
      {children}
    </motion.div>
  );
}
