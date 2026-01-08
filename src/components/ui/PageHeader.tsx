import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, className }) => {
  return (
    <div className={cn("relative mb-10 pt-4", className)}>
      {/* Abstract Background Shapes for Elegance */}
      <div className="absolute top-[-80px] left-[-40px] w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base font-medium max-w-lg leading-relaxed">
            {description}
          </p>
        </motion.div>
        
        {action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-shrink-0 w-full md:w-auto"
          >
            {action}
          </motion.div>
        )}
      </div>
      
      {/* Premium Separator Line */}
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: "circOut" }}
        className="h-[1px] w-full bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-slate-800 dark:via-slate-700 dark:to-transparent mt-8 origin-left"
      />
    </div>
  );
};
