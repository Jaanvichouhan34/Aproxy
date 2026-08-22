import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  GraduationCap,
  School,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Fingerprint,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types/auth';
import { toast } from 'sonner';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname;

  const { login, register, demoLogin, isLoading } = useAuthStore();

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    setErrorMessage(null);
    const toastId = toast.loading(`Authenticating as Demo ${demoRole === 'student' ? 'Student' : 'Faculty'}...`);
    const result = await demoLogin(demoRole);

    if (result.success) {
      toast.success(result.message || 'Demo Login Successful!', { id: toastId });
      const targetPath = from || (demoRole === 'teacher' ? '/teacher' : '/student');
      navigate(targetPath, { replace: true });
    } else {
      toast.error(result.message || 'Demo login failed', { id: toastId });
      setErrorMessage(result.message || 'Demo login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (authMode === 'login') {
      const toastId = toast.loading('Authenticating credentials...');
      const result = await login({ email, password });

      if (result.success) {
        toast.success(result.message || 'Authenticated successfully!', { id: toastId });
        const targetPath = from || (result.role === 'teacher' ? '/teacher' : '/student');
        navigate(targetPath, { replace: true });
      } else {
        toast.error(result.message || 'Authentication failed', { id: toastId });
        setErrorMessage(result.message || 'Invalid email or password');
      }
    } else {
      // Registration
      if (selectedRole === 'student' && !enrollmentNumber.trim()) {
        toast.error('Please enter your Student Roll / Enrollment Number');
        setErrorMessage('Enrollment number is required for student accounts');
        return;
      }

      const toastId = toast.loading('Creating secure cryptographic identity...');
      const result = await register({
        name,
        email,
        password,
        role: selectedRole,
        enrollmentNumber: selectedRole === 'student' ? enrollmentNumber.trim().toUpperCase() : undefined,
        department,
      });

      if (result.success) {
        toast.success('Account created! Welcome to Aproxy.', { id: toastId });
        const targetPath = from || (result.role === 'teacher' ? '/teacher' : '/student');
        navigate(targetPath, { replace: true });
      } else {
        toast.error(result.message || 'Registration failed', { id: toastId });
        setErrorMessage(result.message || 'Could not complete registration');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Aproxy</span>
        </Link>
      </div>

      {/* Main Split Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Visual Brand Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-6">
          <div className="space-y-4">
            <Badge variant="brand" dot pulse>
              ZERO-TRUST ACCESS GATEWAY
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Cryptographically Secure <span className="text-gradient">Institutional Portal</span>
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Access the high-frequency attendance mesh. Students verify on-device biometric vectors; faculty manage rotating QR seeds and live auditoriums with automatic RBAC.
            </p>
          </div>

          {/* Cryptographic Feature Pill Highlights */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">Edge Biometric Enclave</span>
                <span className="text-slate-500 dark:text-slate-400">Zero facial images stored. Encrypted 128D mathematical vectors only.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">JWT Token Rotation & RBAC</span>
                <span className="text-slate-500 dark:text-slate-400">Short-lived access tokens paired with secure HTTP-only refresh rotation.</span>
              </div>
            </div>
          </div>

          {/* Institutional Quote */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="italic">
              "Aproxy decreased proxy rates in our 450-student engineering lectures from 18% down to exactly 0.0% within the first lecture week."
            </p>
            <span className="font-semibold text-slate-800 dark:text-slate-300 block pt-1">
              — Dept. of Computer Science & Cybersecurity
            </span>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Role Switcher Tabs (For Registration and Quick Context) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 uppercase">
                  Account Type:
                </span>
                <span className="text-xs text-brand-500 font-semibold">
                  {selectedRole === 'student' ? 'Student Portal' : 'Faculty Admin'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedRole === 'student'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedRole === 'teacher'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <School className="w-4 h-4" />
                  Faculty
                </button>
              </div>
            </div>

            {/* Auth Mode Toggle (Login vs Register) */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className={`text-sm font-bold transition-colors pb-1 border-b-2 cursor-pointer ${
                    authMode === 'login'
                      ? 'border-brand-500 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className={`text-sm font-bold transition-colors pb-1 border-b-2 cursor-pointer ${
                    authMode === 'register'
                      ? 'border-brand-500 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <Badge variant="brand" className="text-[10px]">
                SSL 256-bit
              </Badge>
            </div>

            {/* Error Alert Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder={selectedRole === 'student' ? 'Alex Rivera' : 'Prof. Marcus Thorne'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {selectedRole === 'student' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Roll Number / Enrollment ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2024-CS-089"
                          value={enrollmentNumber}
                          onChange={(e) => setEnrollmentNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono transition-all uppercase"
                        />
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Academic Department
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Computer Science & Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                      <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                  </div>
                </>
              )}

              {/* Institutional Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Institutional Email (.edu / .ac)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder={selectedRole === 'student' ? 'alex.rivera@university.edu' : 'prof.thorne@university.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {authMode === 'login' && (
                    <span className="text-xs text-brand-500 hover:underline cursor-pointer">
                      Forgot?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="glow"
                size="md"
                className="w-full mt-2 font-semibold"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {authMode === 'login'
                  ? `Sign In to Portal`
                  : `Complete Registration`}
              </Button>
            </form>

            {/* Quick One-Click Demo Logins */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block text-center mb-3">
                ⚡ QUICK 1-CLICK DEMO TEST PRESETS
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('student')}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer group"
                >
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block group-hover:text-brand-500">
                    🎓 Demo Student
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                    Alex Rivera (CS-089)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('teacher')}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer group"
                >
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block group-hover:text-brand-500">
                    👨‍🏫 Demo Faculty
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                    Prof. Marcus Thorne
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500">
        Protected by Aproxy Zero-Trust Cryptographic Engine • AES-256 GCM • JWT Token Rotation
      </div>
    </div>
  );
};
