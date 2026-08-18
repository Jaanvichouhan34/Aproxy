import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline' | 'emerald' | 'cyan' | 'rose';
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  dot = false,
  pulse = false,
  children,
  ...props
}) => {
  const variantClasses = {
    brand: 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20 dark:border-brand-500/30',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 dark:border-rose-500/30',
    rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 dark:border-rose-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20 dark:border-cyan-500/30',
    neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-500/30',
    outline: 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const dotColors = {
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                dotColors[variant]
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[variant])} />
        </span>
      )}
      {children}
    </div>
  );
};
