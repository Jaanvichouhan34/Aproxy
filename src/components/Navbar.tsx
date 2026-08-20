import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  X,
  ArrowUpRight,
  Lock,
  Github,
  Linkedin,
  LogOut,
  User,
  LayoutDashboard,
  GraduationCap,
  School,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

export const Navbar: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Features', href: '/#features' },
    { name: 'Security Matrix', href: '/#security' },
    { name: 'Threat Defense', href: '/#threat-defense' },
    { name: 'Architecture', href: '/architecture' },
    { name: 'Live Sandbox', href: '/demo' },
  ];

  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-surface-darker/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-cyan p-[1px] shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-400 group-hover:text-white transition-colors" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-emerald border-2 border-slate-900"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Aproxy
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                v2.0
              </span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide -mt-1 hidden sm:block">
              Cryptographic Attendance
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
          {navLinks.map((link) => {
            const isInternal = link.href.startsWith('/#');
            const isActive = location.pathname === link.href;

            return isInternal ? (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-1.5 rounded-full transition-colors hover:bg-white dark:hover:bg-slate-800/80"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.href}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* GitHub Profile */}
          <a
            href="https://github.com/Jaanvichouhan34"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Profile"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* LinkedIn Profile */}
          <a
            href="https://linkedin.com/in/jaanvi-chouhan"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn Profile"
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          </a>

          {/* Auth State Conditional Rendering */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/50 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-xs font-semibold text-slate-800 dark:text-white block leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-brand-500 font-medium capitalize">
                    {user.role === 'teacher' ? 'Faculty Admin' : 'Student'}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge variant="brand" className="text-[9px] py-0 px-1.5">
                          {user.role === 'teacher' ? 'Faculty' : 'Student'}
                        </Badge>
                        {user.enrollmentNumber && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {user.enrollmentNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={dashboardPath}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-500" />
                      Open Dashboard
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
          ) : (
            <>
              {/* Sign In Link */}
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Sign In
                </Button>
              </Link>

              {/* Launch App Button */}
              <Link to="/auth?mode=register">
                <Button variant="glow" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  Launch App
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white/95 dark:bg-surface-darker/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-6 py-6 space-y-4"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="glow" size="md" className="w-full">
                      Open Dashboard ({user.role === 'teacher' ? 'Faculty' : 'Student'})
                    </Button>
                  </Link>
                  <Button variant="outline" size="md" onClick={handleLogout} className="w-full text-rose-500">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="glow" size="md" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
