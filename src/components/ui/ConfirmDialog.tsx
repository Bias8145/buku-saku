import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'info' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  type = 'info',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden border border-white/20 dark:border-slate-800 relative"
        >
          {/* Decorative background blur */}
          <div className={`absolute top-0 left-0 w-full h-32 opacity-20 ${
            type === 'danger' ? 'bg-red-500' : 'bg-blue-500'
          } blur-3xl -translate-y-1/2`} />

          <div className="flex flex-col items-center text-center relative z-10">
            <div className={`p-4 rounded-2xl mb-6 shadow-lg ${
              type === 'danger' 
                ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400 shadow-red-500/10' 
                : 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400 shadow-blue-500/10'
            }`}>
              {type === 'danger' ? <AlertTriangle size={32} strokeWidth={1.5} /> : <Info size={32} strokeWidth={1.5} />}
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">{message}</p>
            
            <div className="flex gap-4 w-full">
              <Button variant="ghost" className="flex-1 rounded-xl py-3" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button 
                variant={type === 'danger' ? 'danger' : 'primary'} 
                className={`flex-1 rounded-xl py-3 ${type === 'danger' ? 'shadow-red-500/20' : 'shadow-blue-500/20'}`}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
