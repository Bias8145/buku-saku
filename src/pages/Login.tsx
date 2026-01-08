import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEO } from '../components/SEO';

export const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/');
    } else {
      setError('Password akses tidak valid.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden relative">
      <SEO title="Login" description="Masuk ke aplikasi Buku Saku untuk mengelola toko Anda." />
      {/* Elegant Background Mesh */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 dark:bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] border border-white/50 dark:border-slate-700/50">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6 shadow-sm">
              <Lock size={20} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Selamat Datang.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Masukkan kode akses untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-5 py-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 text-center text-lg tracking-[0.3em] font-medium shadow-sm"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs font-medium text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>
            
            <Button type="submit" className="w-full py-4 text-base rounded-2xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white shadow-lg shadow-slate-200/50 dark:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <span className="flex items-center justify-center gap-2 font-medium">
                Buka Aplikasi <ArrowRight size={18} />
              </span>
            </Button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
              Buku Saku v1.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
