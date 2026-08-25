import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  LayoutGrid,
  Table,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { QRBroadcaster } from '../../components/attendance/QRBroadcaster';
import { LiveAttendanceCommandCenter } from '../../components/attendance/LiveAttendanceCommandCenter';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useTimetableStore } from '../../store/useTimetableStore';
import { toast } from 'sonner';

export const TeacherLiveSessionsPage: React.FC = () => {
  const {
    activeSession,
    isBroadcasting,
    startLiveSession,
    checkActiveSession,
  } = useAttendanceStore();

  const { subjects, fetchSubjects, activeClass, fetchActiveClass } = useTimetableStore();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState('Hall B-201');
  const [selectedBatch, setSelectedBatch] = useState('CS-2026-A');
  const [isStarting, setIsStarting] = useState(false);
  const [viewMode, setViewMode] = useState<'COMMAND_CENTER' | 'PROJECTOR'>('COMMAND_CENTER');

  useEffect(() => {
    checkActiveSession();
    fetchSubjects();
    fetchActiveClass();
  }, [checkActiveSession, fetchSubjects, fetchActiveClass]);

  // Set default subject once subjects load
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      if (activeClass && activeClass.subjectId) {
        setSelectedSubjectId(activeClass.subjectId._id);
        setSelectedRoom(activeClass.roomNumber);
        setSelectedBatch(activeClass.batch);
      } else {
        setSelectedSubjectId(subjects[0]._id);
      }
    }
  }, [subjects, activeClass, selectedSubjectId]);

  const handleStartSession = async () => {
    const selectedSub = subjects.find((s) => s._id === selectedSubjectId);

    setIsStarting(true);
    const res = await startLiveSession({
      subjectId: selectedSubjectId || 'sub-cs402',
      subjectCode: selectedSub ? selectedSub.code : 'CS402',
      subjectName: selectedSub ? selectedSub.name : 'Network Security',
      roomNumber: selectedRoom,
      batch: selectedBatch,
    });
    setIsStarting(false);

    if (res.success) {
      toast.success('Live attendance session broadcast started!');
    } else {
      toast.error(res.message || 'Failed to start session');
    }
  };

  return (
    <div className="space-y-6">
      {/* If Broadcaster is Active -> Show Command Center or Large Projector View */}
      {isBroadcasting && activeSession ? (
        <div className="space-y-4">
          {/* Sub-toolbar to toggle view */}
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('COMMAND_CENTER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'COMMAND_CENTER'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Command Center Table</span>
              </button>
              <button
                onClick={() => setViewMode('PROJECTOR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'PROJECTOR'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Large Projector QR</span>
              </button>
            </div>
          </div>

          {viewMode === 'COMMAND_CENTER' ? (
            <LiveAttendanceCommandCenter
              onToggleProjectorView={() => setViewMode('PROJECTOR')}
              isProjectorView={false}
            />
          ) : (
            <QRBroadcaster onEndSession={() => setViewMode('COMMAND_CENTER')} />
          )}
        </div>
      ) : (
        /* Setup / Session Launcher View */
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Live Classroom Broadcaster
                </h2>
                <Badge variant="neutral" className="text-xs">
                  STANDBY
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Configure classroom parameters to initiate HMAC-SHA256 rotating QR stream with real-time audit mesh
              </p>
            </div>
          </div>

          {/* Launcher Configuration Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Start New Live Attendance Session
                </h3>
                <p className="text-xs text-slate-500">
                  Generates an encrypted 1000ms WebSocket seed stream with 2000ms anti-replay cutoff
                </p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                  Select Course
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {subjects.length > 0 ? (
                    subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.code} — {sub.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="cs402">CS402 — Network Security</option>
                      <option value="cs404">CS404 — Distributed Systems</option>
                      <option value="cs406">CS406 — Cryptography & Protocols</option>
                    </>
                  )}
                </select>
              </div>

              {/* Room Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
                  Auditorium / Room
                </label>
                <input
                  type="text"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  placeholder="e.g. Hall B-201"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Student Batch */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  Target Batch
                </label>
                <input
                  type="text"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  placeholder="e.g. CS-2026-A"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Security Features Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0" />
                <span>HMAC-SHA256 Signed Tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-cyan shrink-0" />
                <span>1000ms WebSocket Rotation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0" />
                <span>Real-Time Audit Mesh</span>
              </div>
            </div>

            {/* Launch Action Button */}
            <Button
              variant="glow"
              size="lg"
              onClick={handleStartSession}
              disabled={isStarting}
              className="w-full font-black text-sm py-4"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isStarting ? 'Initializing Cryptographic Pipeline...' : 'Launch Live Command Center & Broadcaster'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLiveSessionsPage;
