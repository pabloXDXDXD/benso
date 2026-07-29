'use client';

import { type ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollReveal({ 
  children, 
  className = '', 
  style 
}: ScrollRevealProps) {
  return (
    <motion.section
      className={`reveal-section ${className}`.trim()}
      style={style}
      suppressHydrationWarning
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
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
  return (
    <motion.div
      className={className}
      suppressHydrationWarning
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
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
  return (
    <motion.div
      className={className}
      suppressHydrationWarning
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
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