import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NetworkIndicator = () => {
  const [status, setStatus] = useState<'online' | 'weak' | 'offline'>('online');
  const [label, setLabel] = useState('Online');

  useEffect(() => {
    const updateStatus = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        setLabel('Offline');
        return;
      }

      // @ts-ignore - navigator.connection API (Chrome/Android mainly)
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        const type = connection.effectiveType; // 'slow-2g', '2g', '3g', '4g'
        if (type === 'slow-2g' || type === '2g') {
          setStatus('weak');
          setLabel('Sinyal Lemah');
        } else if (type === '3g') {
          setStatus('weak');
          setLabel('3G / Lambat');
        } else {
          setStatus('online');
          setLabel('4G / WiFi');
        }
      } else {
        // Fallback jika browser tidak mendukung connection API
        setStatus('online');
        setLabel('Online');
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      navigator.connection.addEventListener('change', updateStatus);
    }

    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      // @ts-ignore
      if (navigator.connection) {
        // @ts-ignore
        navigator.connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  const getColor = () => {
    switch (status) {
      case 'online': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]';
      case 'weak': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]';
      case 'offline': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    }
  };

  return (
    <div className="flex items-center gap-2 group cursor-help relative">
      {/* Glowing Dot Indicator */}
      <div className="relative flex h-3 w-3">
        {status !== 'offline' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
          }`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 transition-colors duration-500 ${getColor()}`}></span>
      </div>

      {/* Tooltip on Hover */}
      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    </div>
  );
};
