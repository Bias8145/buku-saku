import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto min-w-[300px] max-w-md bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-start gap-3 backdrop-blur-md"
    >
      <div className={`mt-0.5 p-1 rounded-full ${
        toast.type === 'success' 
          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>
      
      <div className="flex-1 pt-0.5">
        <h4 className={`text-sm font-bold ${
          toast.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-tight">
          {toast.message}
        </p>
      </div>

      <button 
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
