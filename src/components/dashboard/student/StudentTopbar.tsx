import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  MapPin,
  Fingerprint,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { Badge } from '../../ui/Badge';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

interface StudentTopbarProps {
  onToggleMobileMenu: () => void;
}

export const StudentTopbar: React.FC<StudentTopbarProps> = ({ onToggleMobileMenu }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbTitle = () => {
    switch (location.pathname) {
      case '/student':
        return 'My Classes & Schedule';
      case '/student/scan':
        return 'Anti-Proxy QR & Biometric Scanner';
      case '/student/stats':
        return 'Attendance Analytics & Health';
      case '/student/face-id':
        return 'Face ID Biometric Enclave';
      default:
        return 'Student Workspace';
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
            <span>Student Portal</span>
            <span>/</span>
            <span className="text-accent-cyan font-medium capitalize">
              {location.pathname.split('/')[2] || 'Overview'}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      {/* Center: Device & Campus Sensor Indicators */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
          <MapPin className="w-3.5 h-3.5" />
          <span>Campus GPS: In-Zone</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-mono">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Face ID: 128D Ready</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
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

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:border-accent-cyan/50 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent-cyan to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline-block max-w-[100px] truncate">
              {user?.name || 'Student'}
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
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                      Student
                    </span>
                    {user?.enrollmentNumber && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {user.enrollmentNumber}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to="/student/face-id"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                >
                  <Fingerprint className="w-4 h-4 text-accent-cyan" />
                  Biometric Settings
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
