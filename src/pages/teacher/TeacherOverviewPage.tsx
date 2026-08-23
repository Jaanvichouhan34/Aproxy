import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Play,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Fingerprint,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { toast } from 'sonner';

export const TeacherOverviewPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState('CS402');
  const [selectedRoom, setSelectedRoom] = useState('Hall B-201');
  const [isLaunching, setIsLaunching] = useState(false);

  const stats = [
    {
      title: 'Enrolled Students',
      value: '184',
      change: '+12 this term',
      icon: Users,
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
    },
    {
      title: 'Avg. Attendance Rate',
      value: '94.8%',
      change: '+6.2% vs last sem',
      icon: CheckCircle2,
      color: 'text-accent-emerald',
      bg: 'bg-accent-emerald/10',
    },
    {
      title: 'Active Live Sessions',
      value: '1',
      change: 'Auditorium Hall B-201',
      icon: Radio,
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
    },
    {
      title: 'Proxy Attacks Prevented',
      value: '42',
      change: '100% rejection rate',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  const recentVerifications = [
    {
      name: 'Alex Rivera',
      rollNo: '2024-CS-089',
      time: 'Just now',
      latency: '24ms',
      status: 'VERIFIED',
      method: 'Face Biometric + Seed Nonce',
    },
    {
      name: 'Elena Rostova',
      rollNo: '2024-CS-042',
      time: '12s ago',
      latency: '18ms',
      status: 'VERIFIED',
      method: 'Face Biometric + Seed Nonce',
    },
    {
      name: 'Liam Vance (Proxy Attempt)',
      rollNo: '2024-CS-077',
      time: '45s ago',
      latency: '1420ms',
      status: 'REJECTED',
      method: 'Screenshot Replay Flagged (>1000ms)',
    },
    {
      name: 'Kavita Sharma',
      rollNo: '2024-CS-112',
      time: '1m ago',
      latency: '31ms',
      status: 'VERIFIED',
      method: 'Face Biometric + Seed Nonce',
    },
  ];

  const upcomingLectures = [
    {
      code: 'CS402',
      title: 'Network Security & Cryptography',
      time: '10:00 AM - 11:30 AM',
      hall: 'Hall B-201',
      enrolled: 64,
      status: 'LIVE_NOW',
    },
    {
      code: 'CS405',
      title: 'Distributed Systems & Consensus',
      time: '01:30 PM - 03:00 PM',
      hall: 'Auditorium 3',
      enrolled: 58,
      status: 'UPCOMING',
    },
    {
      code: 'CS409',
      title: 'Zero-Knowledge Proofs & Identity',
      time: '03:30 PM - 05:00 PM',
      hall: 'Lab 4 (Security Lab)',
      enrolled: 42,
      status: 'UPCOMING',
    },
  ];

  const { startLiveSession } = useAttendanceStore();

  const handleStartQuickSession = async () => {
    setIsLaunching(true);
    const res = await startLiveSession({
      subjectId: selectedCourse === 'CS402' ? 'cs402' : selectedCourse === 'CS405' ? 'cs405' : 'cs409',
      subjectCode: selectedCourse,
      subjectName:
        selectedCourse === 'CS402'
          ? 'Network Security & Cryptography'
          : selectedCourse === 'CS405'
          ? 'Distributed Systems'
          : 'Zero-Knowledge Identity Systems',
      roomNumber: selectedRoom,
      batch: 'CS-2026-A',
    });
    setIsLaunching(false);
    toast.success(`Session started for ${selectedCourse} in ${selectedRoom}`);
    navigate('/teacher/live-sessions');
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-900/40 via-surface-dark to-slate-900/60 border border-brand-500/20 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" dot pulse>
                CRYPTOGRAPHIC ATTENDANCE MESH
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                {user?.department || 'Department of Computer Science'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-gradient">{user?.name || 'Professor'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Manage your dynamic rotating attendance sessions, audit biometric logs, and inspect real-time anti-proxy cryptographic verification.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="glow"
              size="md"
              onClick={() => navigate('/teacher/live-sessions')}
              rightIcon={<Radio className="w-4 h-4" />}
            >
              Open Live Projector
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3 relative overflow-hidden group hover:border-brand-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stat.value}
              </span>
              <span className="text-[11px] text-slate-400 block pt-1">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split: Quick Launch + Live Attendance Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Quick Launch Console */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Quick Session Launcher
                </h3>
              </div>
              <Badge variant="cyan" className="text-[10px]">
                1s Seed Rotation
              </Badge>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="CS402">CS402 - Network Security & Cryptography</option>
                  <option value="CS405">CS405 - Distributed Systems</option>
                  <option value="CS409">CS409 - Zero-Knowledge Identity Systems</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                  Lecture Hall / Venue
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Hall B-201">Hall B-201 (Capacity 120)</option>
                  <option value="Auditorium 3">Auditorium 3 (Capacity 250)</option>
                  <option value="Lab 4">Security Lab 4 (Capacity 60)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Geofence Tolerance</span>
                  <span className="font-mono text-brand-500 font-semibold">25 Meters</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Biometric Similarity</span>
                  <span className="font-mono text-emerald-500 font-semibold">&gt;= 0.90 Cosine</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Nonce Lifetime</span>
                  <span className="font-mono text-accent-cyan font-semibold">1000ms</span>
                </div>
              </div>

              <Button
                variant="glow"
                size="md"
                onClick={handleStartQuickSession}
                isLoading={isLaunching}
                className="w-full font-semibold"
                rightIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Broadcast Session to Hall
              </Button>
            </div>
          </div>

          {/* Today's Schedule Mini-widget */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Lectures
                </h3>
              </div>
              <button
                onClick={() => navigate('/teacher/timetable')}
                className="text-xs text-brand-500 hover:underline cursor-pointer"
              >
                View Full
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingLectures.map((lec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {lec.code}
                      </span>
                      <span className="text-[11px] text-slate-500">{lec.hall}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{lec.time}</span>
                  </div>
                  {lec.status === 'LIVE_NOW' ? (
                    <Badge variant="rose" className="text-[10px] animate-pulse">
                      🔴 Live Now
                    </Badge>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">Scheduled</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Real-time Live Attendance Verification Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-accent-cyan" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Anti-Proxy Verification Stream
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sub-millisecond cryptographic signature matching in active auditoriums
                </p>
              </div>

              <Badge variant="emerald" dot pulse className="text-[10px]">
                MESH SYNCED
              </Badge>
            </div>

            {/* Verification Feed List */}
            <div className="space-y-3">
              {recentVerifications.map((row, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    row.status === 'VERIFIED'
                      ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      : 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          row.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {row.status === 'VERIFIED' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {row.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {row.rollNo}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">{row.method}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          row.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {row.status} ({row.latency})
                      </span>
                      <span className="text-[10px] text-slate-400 block pt-1 font-mono">
                        {row.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Active Nonce Seed: 0x9B41F0A8 (Expires in 420ms)
              </span>
              <button
                onClick={() => navigate('/teacher/history')}
                className="text-xs font-semibold text-brand-500 hover:text-brand-400 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Audit Log</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
