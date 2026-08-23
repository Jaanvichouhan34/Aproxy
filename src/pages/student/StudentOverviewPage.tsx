import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  Clock,
  MapPin,
  Fingerprint,
  ShieldCheck,
  Zap,
  Radio,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  Layers,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useTimetableStore } from '../../store/useTimetableStore';
import { TimetableGrid } from '../../components/timetable/TimetableGrid';
import { TimeSimulatorBar } from '../../components/timetable/TimeSimulatorBar';

export const StudentOverviewPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    studentSchedule,
    activeClass,
    nextClass,
    hasActiveClass,
    timeRemainingMinutes,
    startsInMinutes,
    fetchStudentSchedule,
    fetchActiveClass,
    isLoading,
  } = useTimetableStore();

  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');

  useEffect(() => {
    fetchStudentSchedule();
    fetchActiveClass();

    const interval = setInterval(() => {
      fetchActiveClass();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Today's classes calculated dynamically
  const todayDay = new Date().getDay();
  const todayClasses = studentSchedule.filter(
    (s) => s.dayOfWeek === (todayDay === 0 ? 1 : todayDay)
  );

  return (
    <div className="space-y-8">
      {/* 1. PROMINENT "CLASS IN PROGRESS" / NEXT CLASS HIGH-PRIORITY BANNER */}
      {hasActiveClass && activeClass ? (
        <div className="rounded-3xl bg-gradient-to-r from-rose-950/70 via-surface-dark to-slate-900 border-2 border-rose-500/50 p-6 sm:p-8 relative overflow-hidden shadow-2xl ring-2 ring-rose-500/20 animate-pulse-subtle">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="rose" dot pulse className="font-bold tracking-wider text-xs">
                  🔴 CLASS IN PROGRESS • ATTENDANCE BROADCAST OPEN
                </Badge>
                <span className="text-xs font-mono text-accent-cyan font-semibold">
                  {activeClass.roomNumber}
                </span>
                {timeRemainingMinutes > 0 && (
                  <span className="text-xs font-mono text-amber-400">
                    ({timeRemainingMinutes} mins remaining)
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeClass.subjectId?.code}: {activeClass.subjectId?.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Instructor:{' '}
                <span className="font-semibold text-white">
                  {typeof activeClass.teacherId === 'object' && activeClass.teacherId?.name
                    ? activeClass.teacherId.name
                    : 'Faculty Member'}
                </span>
                . Authenticate with your device Edge Face ID to record cryptographic attendance tokens.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Button
                variant="glow"
                size="lg"
                onClick={() =>
                  navigate('/student/scan', {
                    state: {
                      courseCode: activeClass.subjectId?.code,
                      roomNumber: activeClass.roomNumber,
                    },
                  })
                }
                className="font-bold shadow-xl shadow-brand-500/30 text-sm bg-rose-600 hover:bg-rose-500"
                rightIcon={<QrCode className="w-5 h-5" />}
              >
                Quick Scan & Verify
              </Button>
            </div>
          </div>
        </div>
      ) : nextClass ? (
        <div className="rounded-3xl bg-gradient-to-r from-brand-900/40 via-surface-dark to-slate-900 border border-brand-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="cyan" className="font-mono text-xs">
                  NEXT SCHEDULED CLASS
                </Badge>
                <span className="text-xs font-mono text-brand-400 font-semibold">
                  {nextClass.startTime} — {nextClass.endTime}
                </span>
                {startsInMinutes > 0 && (
                  <span className="text-xs font-mono text-slate-400">
                    (Starts in {startsInMinutes} mins)
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {nextClass.subjectId?.code}: {nextClass.subjectId?.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Venue: <span className="font-semibold text-accent-cyan">{nextClass.roomNumber}</span> • Batch: {nextClass.batch}. Ensure your hardware Face ID enclave is calibrated before arrival.
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/student/scan')}
                className="text-xs font-semibold"
                rightIcon={<QrCode className="w-4 h-4" />}
              >
                Open Camera Scanner
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-r from-slate-800/60 via-surface-dark to-slate-900 border border-slate-700/40 p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="emerald" dot>
                  ALL CLASSES COMPLETED TODAY
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                No active lectures right now
              </h2>
              <p className="text-xs text-slate-400">
                Check your weekly timetable below to prepare for upcoming semester lectures.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('weekly')}
              className="text-xs shrink-0"
              rightIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              View Full Week
            </Button>
          </div>
        </div>
      )}

      {/* Clock Simulator Toolbar (Helper for Demo Testing) */}
      <TimeSimulatorBar />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cumulative Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              95.4%
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block pt-1 font-medium">
              ✓ Safe (+20.4% above 75% cutoff)
            </span>
          </div>
        </div>

        {/* Classes Attended */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Lectures Attended
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              42 / 44
            </span>
            <span className="text-[11px] text-slate-400 block pt-1 font-mono">
              2 Allowed Absences Remaining
            </span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Attendance Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-amber/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              14 Days
            </span>
            <span className="text-[11px] text-amber-500 block pt-1 font-medium">
              🔥 Perfect Attendance Streak
            </span>
          </div>
        </div>

        {/* Biometric Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Edge Face ID
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              128D Enclave
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block pt-1 font-medium">
              ✓ Hardware Protected
            </span>
          </div>
        </div>
      </div>

      {/* Main Split: Timetable Switcher + Biometric Hardware Binding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Timetable (Today's Feed / Full Weekly View) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* Timetable Header with Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Academic Classroom Schedule
                </h3>
                <p className="text-[11px] text-slate-400">
                  Enrolled course checkpoints with real-time room verification
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'today'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Today's Feed
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'weekly'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Weekly Matrix
                </button>
              </div>
            </div>

            {/* Tab 1: Today's Feed */}
            {activeTab === 'today' ? (
              <div className="space-y-3">
                {todayClasses.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">No scheduled classes for today.</p>
                  </div>
                ) : (
                  todayClasses.map((cls) => {
                    const isActive = hasActiveClass && activeClass?._id === cls._id;
                    const color = cls.subjectId?.colorTag || '#6366F1';
                    const teacherName =
                      typeof cls.teacherId === 'object' && cls.teacherId?.name
                        ? cls.teacherId.name
                        : 'Faculty Member';

                    return (
                      <div
                        key={cls._id}
                        style={{
                          borderLeftColor: color,
                          borderLeftWidth: '4px',
                        }}
                        className={`p-4 rounded-2xl border transition-all ${
                          isActive
                            ? 'border-2 border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 shadow-md ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-mono font-bold text-xs px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${color}15`,
                                  color: color,
                                }}
                              >
                                {cls.subjectId?.code}
                              </span>
                              <Badge variant="brand" className="text-[10px]">
                                {cls.classType}
                              </Badge>
                              {isActive && (
                                <Badge variant="rose" dot pulse className="text-[10px] font-bold">
                                  LIVE NOW
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {cls.subjectId?.name}
                            </h4>
                            <p className="text-xs text-slate-500">Instructor: {teacherName}</p>

                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-brand-500" />
                                <span>
                                  {cls.startTime} - {cls.endTime}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
                                <span>{cls.roomNumber}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isActive ? (
                              <Button
                                variant="glow"
                                size="sm"
                                onClick={() =>
                                  navigate('/student/scan', {
                                    state: {
                                      courseCode: cls.subjectId?.code,
                                      roomNumber: cls.roomNumber,
                                    },
                                  })
                                }
                                className="bg-rose-600 hover:bg-rose-500 text-xs font-bold"
                                rightIcon={<QrCode className="w-3.5 h-3.5" />}
                              >
                                Scan QR
                              </Button>
                            ) : (
                              <span className="text-xs font-mono text-slate-400">Scheduled</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Tab 2: Full Weekly Timetable Grid */
              <TimetableGrid schedule={studentSchedule} isTeacher={false} />
            )}
          </div>
        </div>

        {/* Right: Biometric & Device Security Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Zero-Trust Biometrics
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Device Hardware Binding
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] block">Enrolled Student</span>
                <span className="font-bold text-slate-900 dark:text-white block font-mono">
                  {user?.name || 'Alex Rivera'}
                </span>
                <span className="text-slate-400 text-[10px] block font-mono">
                  ID: {user?.enrollmentNumber || '2024-CS-089'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] block">Vector Hash (SHA-256)</span>
                <span className="text-accent-cyan text-[10px] block font-mono truncate">
                  0x8F3A2B1C90D4E7...42A1
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
                <span className="font-bold block">✓ Anti-Proxy Protection Active</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Attendance tokens are signed using hardware keys and ephemeral classroom seeds.
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/student/face-id')}
                rightIcon={<Fingerprint className="w-3.5 h-3.5" />}
              >
                Manage Face ID
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
