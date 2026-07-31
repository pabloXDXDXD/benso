'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'motion/react';

const SAFETY_TIMEOUT_MS = 1500;

function useRevealControls(amount: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const controls = useAnimation();
  const inView = useInView(ref, { once: true, amount });

  useEffect(() => {
    if (inView) {
      controls.start({ opacity: 1, y: 0 });
      return;
    }
    const timer = setTimeout(() => {
      controls.start({ opacity: 1, y: 0 });
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [controls, inView]);

  return { ref, controls };
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
  const { ref, controls } = useRevealControls(0.25);

  return (
    <motion.section
      ref={ref}
      className={`reveal-section ${className}`.trim()}
      style={style}
      suppressHydrationWarning
      initial={{ opacity: 0, y: 60 }}
      animate={controls}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
  const { ref, controls } = useRevealControls(0.2);

  return (
    <motion.div
      ref={ref}
      className={className}
      suppressHydrationWarning
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
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
  const { ref, controls } = useRevealControls(0.15);

  return (
    <motion.div
      ref={ref}
      className={className}
      suppressHydrationWarning
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        delay: index * 0.08
      }}
    >
      {children}
    </motion.div>
  );
}
