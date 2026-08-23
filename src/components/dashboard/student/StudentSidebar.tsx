import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  BarChart3,
  Fingerprint,
  ShieldCheck,
  LogOut,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Badge } from '../../ui/Badge';
import { toast } from 'sonner';

interface StudentSidebarProps {
  onCloseMobile?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { label: 'My Classes & Schedule', path: '/student', icon: BookOpen, exact: true },
    { label: 'Scan Attendance', path: '/student/scan', icon: QrCode, badge: 'Live' },
    { label: 'Attendance Stats', path: '/student/stats', icon: BarChart3 },
    { label: 'Face ID & Biometrics', path: '/student/face-id', icon: Fingerprint },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-surface-darker border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full select-none">
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-cyan p-[1px] shadow-md shadow-brand-500/20">
              <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                Aproxy
                <span className="text-[10px] font-mono text-accent-cyan bg-accent-cyan/10 px-1 py-0.2 rounded border border-accent-cyan/20">
                  STUDENT
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Edge Biometric Enclave
              </span>
            </div>
          </NavLink>
        </div>

        {/* Quick Scan CTA Button */}
        <div className="p-4">
          <button
            onClick={() => {
              navigate('/student/scan');
              onCloseMobile?.();
            }}
            className="w-full group flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Live Class QR</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 block py-1.5">
            Student Navigation
          </span>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-mono uppercase font-bold animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-cyan to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="overflow-hidden flex-grow">
            <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
              {user?.name || 'Alex Rivera'}
            </span>
            <span className="text-[10px] text-slate-400 block truncate font-mono">
              {user?.enrollmentNumber || '2024-CS-089'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
