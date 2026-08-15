'use client';

import { Children, type CSSProperties, type ReactNode, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useReducedMotion } from 'motion/react';

const SAFETY_TIMEOUT_MS = 1500;

const REVEAL_CONFIG = {
  amount: 0.2,
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
  y: 40,
};

function useRevealControls(amount: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const controls = useAnimation();
  const inView = useInView(ref, { once: true, amount });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      controls.start({ opacity: 1, y: 0 });
      return;
    }
    if (inView) {
      controls.start({ opacity: 1, y: 0 });
      return;
    }
    const timer = setTimeout(() => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect && rect.top < window.innerHeight) {
        controls.start({ opacity: 1, y: 0 });
      }
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [controls, inView, reduce]);

  return { ref, controls, reduced: reduce };
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ScrollReveal({
  children,
  className = '',
  style
}: ScrollRevealProps) {
  const { ref, controls, reduced } = useRevealControls(REVEAL_CONFIG.amount);

  return (
    <motion.section
      ref={ref}
      className={`reveal-section ${className}`.trim()}
      style={style}
      suppressHydrationWarning
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: REVEAL_CONFIG.y }}
      animate={controls}
      transition={{ duration: REVEAL_CONFIG.duration, ease: REVEAL_CONFIG.ease }}
    >
      {children}
    </motion.section>
  );
}

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({
  children,
  className = '',
  delay = 0
}: AnimatedSectionProps) {
  const { ref, controls, reduced } = useRevealControls(REVEAL_CONFIG.amount);

  return (
    <motion.div
      ref={ref}
      className={className}
      suppressHydrationWarning
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: REVEAL_CONFIG.y }}
      animate={controls}
      transition={{
        duration: REVEAL_CONFIG.duration,
        ease: REVEAL_CONFIG.ease,
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function AnimatedCard({
  children,
  className = '',
  index = 0
}: AnimatedCardProps) {
  const { ref, controls, reduced } = useRevealControls(REVEAL_CONFIG.amount);

  return (
    <motion.div
      ref={ref}
      className={className}
      suppressHydrationWarning
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: REVEAL_CONFIG.y }}
      animate={controls}
      transition={{
        duration: REVEAL_CONFIG.duration,
        ease: REVEAL_CONFIG.ease,
        delay: index * 0.08
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay before the FIRST child starts (seconds). */
  delay?: number;
  /** Stagger between consecutive children (seconds). */
  gap?: number;
}

/**
 * Reveals each direct child in sequence (fade + rise) as the group
 * scrolls into view. Wraps every child in a plain motion.div — safe for
 * block-level stacks (CTA content, headers + copy + buttons).
 */
export function StaggerReveal({
  children,
  className = '',
  delay = 0,
  gap = 0.12
}: StaggerRevealProps) {
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, index) => (
        <motion.div
          key={index}
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: REVEAL_CONFIG.duration,
            ease: REVEAL_CONFIG.ease,
            delay: delay + index * gap
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
