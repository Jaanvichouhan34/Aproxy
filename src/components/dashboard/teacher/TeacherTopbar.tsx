import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Radio,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { Badge } from '../../ui/Badge';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

interface TeacherTopbarProps {
  onToggleMobileMenu: () => void;
}

export const TeacherTopbar: React.FC<TeacherTopbarProps> = ({ onToggleMobileMenu }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbTitle = () => {
    switch (location.pathname) {
      case '/teacher':
        return 'Overview Dashboard';
      case '/teacher/timetable':
        return 'Faculty Timetable';
      case '/teacher/live-sessions':
        return 'Live Attendance Broadcast';
      case '/teacher/history':
        return 'Attendance Audit Logs';
      case '/teacher/students':
        return 'Enrolled Student Roster';
      case '/teacher/settings':
        return 'Cryptographic Security Settings';
      default:
        return 'Teacher Workspace';
    }
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="h-16 bg-white dark:bg-surface-darker/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Faculty</span>
            <span>/</span>
            <span className="text-brand-500 font-medium capitalize">
              {location.pathname.split('/')[2] || 'Overview'}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      {/* Center/Right: Active Live Class Status Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span className="font-mono">CS402: Live Broadcast Active (Hall B-201)</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search shortcut */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 w-48">
          <Search className="w-3.5 h-3.5" />
          <span className="truncate">Search students...</span>
          <kbd className="ml-auto text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-500">
            ⌘K
          </kbd>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 relative transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 space-y-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Live Session Alerts
                  </span>
                  <Badge variant="brand" className="text-[9px]">
                    2 New
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      🛡️ Proxy Attempt Blocked
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Token replay (latency &gt; 1200ms) flagged and rejected in CS402.
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      ⚡ 48 Students Verified
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Biometric signatures verified for Lecture Hall B-201.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.charAt(0) || 'F'}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline-block max-w-[100px] truncate">
              {user?.name || 'Faculty'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {user?.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate font-mono">
                    {user?.email}
                  </span>
                  <div className="mt-1">
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                      Faculty / Instructor
                    </span>
                  </div>
                </div>

                <Link
                  to="/teacher/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-brand-500" />
                  Account & Nonce Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
