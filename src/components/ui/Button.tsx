import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900/20',
      secondary: 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-slate-700 dark:text-blue-100 dark:hover:bg-slate-600',
      danger: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-300 dark:hover:bg-slate-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-5 py-2.5 text-sm font-medium rounded-xl',
      lg: 'px-6 py-3 text-base font-medium rounded-2xl',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
