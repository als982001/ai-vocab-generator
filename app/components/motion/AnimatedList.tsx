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
  // true면 부모 stagger에 기대지 않고 마운트 시 스스로 등장 애니메이션을 한다.
  // 부모가 이미 visible이 된 뒤 늦게 추가되는 항목(스트리밍 결과 등)은
  // 이 옵션이 없으면 hidden(opacity 0)에 멈춘다. 대신 부모의 stagger 순차 등장은 적용되지 않는다
  animateOnMount?: boolean;
}

/**
 * AnimatedList 안에서 페이드·슬라이드 업으로 등장하는 항목
 * @param children 항목 내용
 * @param className 항목 래퍼 클래스
 * @param animateOnMount 마운트 시 스스로 등장 애니메이션 (기본 false = 부모 stagger를 따름)
 * @return 애니메이션 항목 요소
 */
export function AnimatedListItem({
  children,
  className,
  animateOnMount = false,
}: IAnimatedListItemProps) {
  return (
    <motion.div
      variants={FADE_SLIDE_UP}
      initial={animateOnMount ? "hidden" : undefined}
      animate={animateOnMount ? "visible" : undefined}
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
