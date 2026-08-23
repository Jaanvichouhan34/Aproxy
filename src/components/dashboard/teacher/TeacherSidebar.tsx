import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Radio,
  History,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  PlusCircle,
  Sparkles,
  ChevronRight,
  School,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Badge } from '../../ui/Badge';
import { toast } from 'sonner';

interface TeacherSidebarProps {
  onCloseMobile?: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', path: '/teacher', icon: LayoutDashboard, exact: true },
    { label: 'Timetable', path: '/teacher/timetable', icon: Calendar },
    { label: 'Live Sessions', path: '/teacher/live-sessions', icon: Radio, badge: 'Live' },
    { label: 'Attendance History', path: '/teacher/history', icon: History },
    { label: 'Analytics & Reports', path: '/teacher/analytics', icon: TrendingUp },
    { label: 'Student Roster', path: '/teacher/students', icon: Users },
    { label: 'Security & Settings', path: '/teacher/settings', icon: Settings },
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
                <span className="text-[10px] font-mono text-brand-500 bg-brand-500/10 px-1 py-0.2 rounded border border-brand-500/20">
                  FACULTY
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Cryptographic Portal
              </span>
            </div>
          </NavLink>
        </div>

        {/* Quick Session Start Button */}
        <div className="p-4">
          <button
            onClick={() => {
              navigate('/teacher/live-sessions');
              onCloseMobile?.();
            }}
            className="w-full group flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span>Launch Live Session</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 block py-1.5">
            Classroom Controls
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
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {user?.name?.charAt(0) || 'F'}
          </div>
          <div className="overflow-hidden flex-grow">
            <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
              {user?.name || 'Faculty Member'}
            </span>
            <span className="text-[10px] text-slate-400 block truncate font-mono">
              {user?.department || 'Dept. of CS'}
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
