import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Search,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Zap,
  Radio,
  Maximize2,
  Volume2,
  VolumeX,
  StopCircle,
  Sparkles,
  Layers,
  MapPin,
  Download,
  Filter,
  UserCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAttendanceStore, LiveRosterStudent } from '../../store/useAttendanceStore';
import { ManualOverrideModal } from './ManualOverrideModal';
import { toast } from 'sonner';

interface LiveAttendanceCommandCenterProps {
  onToggleProjectorView?: () => void;
  isProjectorView?: boolean;
}

export const LiveAttendanceCommandCenter: React.FC<LiveAttendanceCommandCenterProps> = ({
  onToggleProjectorView,
  isProjectorView,
}) => {
  const {
    activeSession,
    currentPayload,
    countdown,
    progressPercent,
    isBroadcasting,
    streamLogs,
    soundEnabled,
    setSoundEnabled,
    forceRotate,
    endLiveSession,
    liveRoster,
    sessionStats,
    fetchLiveRoster,
  } = useAttendanceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT'>('ALL');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideStudent, setOverrideStudent] = useState<LiveRosterStudent | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Auto-fetch and poll live roster every 5s if active
  useEffect(() => {
    if (activeSession) {
      fetchLiveRoster(activeSession.id);
      const interval = setInterval(() => {
        fetchLiveRoster(activeSession.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSession, fetchLiveRoster]);

  // Elapsed Session Timer
  useEffect(() => {
    if (!activeSession) return;
    const start = activeSession.startedAt ? new Date(activeSession.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenOverride = (student?: LiveRosterStudent) => {
    setOverrideStudent(student || null);
    setIsOverrideModalOpen(true);
  };

  const handleEnd = async () => {
    await endLiveSession();
    toast.success('Live attendance session ended. Cryptographic keys invalidated.');
  };

  const filteredRoster = liveRoster.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PRESENT' && student.status === 'PRESENT') ||
      (statusFilter === 'LATE' && student.status === 'LATE') ||
      (statusFilter === 'EXCUSED' && student.status === 'EXCUSED') ||
      (statusFilter === 'ABSENT' && student.status === 'ABSENT');

    return matchesSearch && matchesStatus;
  });

  const totalEnrolled = sessionStats.totalEnrolled || liveRoster.length || 64;
  const totalPresent = sessionStats.totalPresent || liveRoster.filter((r) => r.status === 'PRESENT').length;
  const totalLate = sessionStats.totalLate || liveRoster.filter((r) => r.status === 'LATE').length;
  const totalExcused = sessionStats.totalExcused || liveRoster.filter((r) => r.status === 'EXCUSED').length;
  const totalAbsent = sessionStats.totalAbsent || Math.max(0, totalEnrolled - (totalPresent + totalLate + totalExcused));
  const rate = totalEnrolled > 0 ? Number((((totalPresent + totalLate) / totalEnrolled) * 100).toFixed(1)) : 0;

  // Circular Gauge Calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ≈ 376.99
  const clampedRate = Math.min(100, Math.max(0, rate));
  const strokeDashoffset = circumference - (clampedRate / 100) * circumference;

  const getGaugeColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-500 stroke-emerald-500';
    if (pct >= 75) return 'text-cyan-500 stroke-cyan-500';
    if (pct >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Session Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeSession?.subjectCode} — {activeSession?.subjectName}
            </h2>
            <Badge variant="rose" className="text-[10px] font-mono">
              LIVE STREAM
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              {activeSession?.roomNumber || 'Hall B-201'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-accent-cyan" />
              Batch: {activeSession?.batch || 'CS-2026-A'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Elapsed: {formatElapsed(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleProjectorView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleProjectorView}
              className="text-slate-700 dark:text-slate-200"
            >
              <Radio className="w-3.5 h-3.5 mr-1 text-brand-500" />
              {isProjectorView ? 'Switch to Command Table' : 'Switch to Large Projector'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-slate-600 dark:text-slate-300"
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenOverride()}
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            <span>Manual Override</span>
          </Button>

          <Button variant="outline" size="sm" onClick={forceRotate}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Rotate Nonce</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEnd}
            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-500/30"
          >
            <StopCircle className="w-3.5 h-3.5 mr-1" />
            End Session
          </Button>
        </div>
      </div>

      {/* Metrics Row: Circular Gauge + Status Cards + Real-Time Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Circular Gauge Card */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Attendance Capacity
              </h3>
            </div>
            <Badge variant="cyan" dot pulse className="text-[10px]">
              SUB-MILLI SYNC
            </Badge>
          </div>

          {/* Central Circular Gauge */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800/80"
                />
                {/* Dynamic Progress Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className={`transition-all duration-700 ease-out ${getGaugeColor(rate)}`}
                />
              </svg>

              {/* Center Text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {rate}%
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {totalPresent + totalLate}/{totalEnrolled}
                </span>
              </div>
            </div>

            {/* Breakdown Legend */}
            <div className="space-y-2.5 font-mono text-xs w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Present
                </span>
                <span className="font-bold">{totalPresent}</span>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Late
                </span>
                <span className="font-bold">{totalLate}</span>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Excused
                </span>
                <span className="font-bold">{totalExcused}</span>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
                <span>Pending / Absent</span>
                <span className="font-bold">{totalAbsent}</span>
              </div>
            </div>
          </div>

          {/* Nonce Pulse & Rotation Bar */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent-cyan" />
                Next Token Seed:
              </span>
              <span className="text-accent-cyan font-bold">
                {currentPayload?.nonce || '0x9B41F0A8'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-75 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Live Stream Audit Feed */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Verification Feed Stream
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {streamLogs.length} events received
            </span>
          </div>

          {/* Real-time event ticker */}
          <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto pr-1">
            {streamLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${
                  log.status === 'VERIFIED'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : log.status === 'OVERRIDDEN'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>[{log.time}]</span>
                    <span>{log.studentName}</span>
                    <span className="opacity-75">({log.enrollmentNumber})</span>
                  </div>
                  <div className="text-[11px] opacity-80">{log.method}</div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black block">{log.status}</span>
                  <span className="text-[10px] opacity-80">{log.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>2000ms Anti-Replay Sliding Window</span>
            <span className="text-emerald-500">Auto-Synced via Socket.IO</span>
          </div>
        </div>
      </div>

      {/* Main Live Searchable & Filterable Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Table Toolbar: Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search live roster by student name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Status Filter Toggle Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
            {(['ALL', 'PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Student & Roll No</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Verified Status</th>
                <th className="px-5 py-3.5">Verification Method</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredRoster.map((student) => (
                <tr
                  key={student.id || student.studentId || student.rollNo}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {student.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {student.rollNo}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-500 font-sans text-xs">
                    {student.department}
                  </td>

                  <td className="px-5 py-3.5">
                    {student.status === 'PRESENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> PRESENT
                      </span>
                    ) : student.status === 'LATE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                        <Clock className="w-3 h-3" /> LATE
                      </span>
                    ) : student.status === 'EXCUSED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        <FileText className="w-3 h-3" /> EXCUSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                        PENDING
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    {student.isManualOverride ? (
                      <div className="space-y-0.5 font-sans">
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Faculty Override
                        </span>
                        {student.overrideReason && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {student.overrideReason}
                          </span>
                        )}
                      </div>
                    ) : student.verificationMethod === 'BIOMETRIC_QR' ? (
                      <span className="text-brand-600 dark:text-brand-400 font-medium text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald" />
                        Biometric 128D + QR
                      </span>
                    ) : student.verificationMethod === 'DYNAMIC_QR' ? (
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium text-[11px] flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Dynamic Nonce
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                    {student.verifiedAt ? (
                      new Date(student.verifiedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right font-sans">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenOverride(student)}
                      className="py-1 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-amber-500 border-slate-200 dark:border-slate-800"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      <span>Override</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      <ManualOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setOverrideStudent(null);
        }}
        selectedStudent={overrideStudent}
        sessionId={activeSession?.id || 'live-session'}
      />
    </div>
  );
};

export default LiveAttendanceCommandCenter;
