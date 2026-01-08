import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  StickyNote, 
  LogOut, 
  Sun, 
  Moon, 
  PanelLeftClose,
  PanelLeftOpen,
  ScanBarcode // Icon Baru
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { NetworkIndicator } from './NetworkIndicator';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ScanBarcode, label: 'Kasir', path: '/cashier' }, // Menu Baru
  { icon: Receipt, label: 'Transaksi', path: '/transactions' },
  { icon: Package, label: 'Stok', path: '/inventory' },
  { icon: StickyNote, label: 'Catatan', path: '/notes' },
];

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] flex font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 h-screen sticky top-0 z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
      >
        {/* Elegant Sidebar Header */}
        <div className={cn("h-24 flex items-center transition-all duration-300", isCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
          {!isCollapsed && (
            <div className="flex flex-col">
              <motion.h1 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight"
              >
                Buku Saku.
              </motion.h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">Management</span>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200',
                  isCollapsed && 'justify-center px-3'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative z-10 flex items-center justify-center">
                    <item.icon 
                      size={22} 
                      strokeWidth={isActive ? 2 : 1.5} 
                      className={cn("transition-transform duration-300", !isActive && "group-hover:scale-110")} 
                    />
                  </div>
                  
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm truncate relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Active Indicator Line */}
                  {isActive && !isCollapsed && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
                    />
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-xl font-medium translate-x-2 group-hover:translate-x-0">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={cn("p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-2", isCollapsed && "px-3")}>
           {/* Network Indicator in Sidebar */}
           <div className={cn("flex items-center gap-3 px-4 py-2 mb-2", isCollapsed && "justify-center")}>
             <NetworkIndicator />
             {!isCollapsed && <span className="text-xs text-slate-400 font-medium">Status Koneksi</span>}
           </div>

           <button 
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all text-sm group",
              isCollapsed && "justify-center"
            )}
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            <div className="relative">
              {theme === 'light' ? <Moon size={20} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform" /> : <Sun size={20} strokeWidth={1.5} className="group-hover:rotate-90 transition-transform" />}
            </div>
            {!isCollapsed && <span>{theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 w-full text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all text-sm group",
              isCollapsed && "justify-center"
            )}
            title="Keluar"
          >
            <LogOut size={20} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-10 pb-28 md:pb-10 min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Top Brand (Minimal) */}
          <div className="md:hidden flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Buku Saku.</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Management</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Network Indicator Mobile */}
              <div className="mr-1">
                <NetworkIndicator />
              </div>

              <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button onClick={handleLogout} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-red-500">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Floating Dock) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] dark:shadow-black/50 rounded-2xl p-2 flex justify-around items-center">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-300 relative',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive && "bg-blue-50 dark:bg-blue-900/20 translate-y-[-4px] shadow-sm"
                  )}>
                    <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-1 transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 absolute bottom-0"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};
