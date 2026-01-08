import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800/60',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
