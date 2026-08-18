import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLMotionProps<"div"> {
  gradientBorder?: boolean;
  glow?: 'none' | 'brand' | 'cyan' | 'emerald';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  gradientBorder = false,
  glow = 'none',
  hoverEffect = true,
  ...props
}) => {
  const glowClasses = {
    none: '',
    brand: 'shadow-lg shadow-brand-500/10 dark:shadow-brand-500/20 border-brand-500/30',
    cyan: 'shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/20 border-cyan-500/30',
    emerald: 'shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/20 border-emerald-500/30',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'relative rounded-2xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm overflow-hidden transition-shadow duration-300',
        gradientBorder && 'before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-b before:from-slate-300 before:to-transparent dark:before:from-slate-700/60 dark:before:to-transparent before:-z-10',
        glowClasses[glow],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
