import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Terjadi Kesalahan</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Aplikasi mengalami kendala saat memuat. Silakan coba muat ulang halaman.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6 text-left overflow-auto max-h-32">
              <code className="text-xs text-slate-600 dark:text-slate-300 font-mono break-all">
                {this.state.error?.message || 'Unknown Error'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
