import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Radio,
  RefreshCw,
  StopCircle,
  ShieldCheck,
  Zap,
  Users,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Lock,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { toast } from 'sonner';

interface QRBroadcasterProps {
  onEndSession?: () => void;
}

export const QRBroadcaster: React.FC<QRBroadcasterProps> = ({ onEndSession }) => {
  const {
    activeSession,
    currentPayload,
    countdown,
    progressPercent,
    isBroadcasting,
    totalEnrolled,
    streamLogs,
    soundEnabled,
    setSoundEnabled,
    forceRotate,
    endLiveSession,
  } = useAttendanceStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback payload if WebSocket is connecting
  const displayPayload = currentPayload || {
    sessionId: activeSession?.id || 'session-local-init',
    token: 'eyJzIjoiY3M0MDIiLCJ0IjoxNzAwMDAwMDAwLCJuIjoiMHg4RjNBMkIxQzkwRDQiLCJzaWciOiJkZW1vIn0',
    timestamp: Date.now(),
    nonce: '0x8F3A2B1C90D4',
    signature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    validityMs: 2000,
  };

  // QR String encoding for the scanner camera to decode
  const qrStringValue = JSON.stringify({
    sessionId: displayPayload.sessionId,
    timestamp: displayPayload.timestamp,
    nonce: displayPayload.nonce,
    signature: displayPayload.signature,
    token: displayPayload.token,
    v: 1,
  });

  // Elapsed Session Timer
  useEffect(() => {
    if (!activeSession) return;
    const start = activeSession.startedAt ? new Date(activeSession.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleEnd = async () => {
    await endLiveSession();
    toast.success('Live attendance session terminated. Cryptographic seeds revoked.');
    if (onEndSession) onEndSession();
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalAttended = activeSession?.totalAttended || 0;
  const attendanceRate = totalEnrolled > 0 ? Math.round((totalAttended / totalEnrolled) * 100) : 0;

  // Countdown Ring Math (Radius 44, Circumference = 2 * PI * 44 ≈ 276.46)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 text-white p-8 sm:p-12 overflow-y-auto flex flex-col justify-between'
          : 'space-y-6'
      }`}
    >
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`font-black tracking-tight ${
                isFullscreen ? 'text-3xl text-white' : 'text-xl sm:text-2xl text-slate-900 dark:text-white'
              }`}
            >
              {activeSession ? `${activeSession.subjectCode} — ${activeSession.subjectName}` : 'Live Classroom Projector'}
            </h2>
            <Badge variant="rose" dot pulse className="text-xs">
              1000ms ROTATING QR
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-slate-600 dark:text-slate-300"
            title={soundEnabled ? 'Mute Check-in Sound' : 'Enable Check-in Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="text-slate-600 dark:text-slate-300"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Projector Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Projector Mode'}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={forceRotate}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Force Nonce</span>
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

      {/* Main Grid: QR Projector Canvas + Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center: High-Frequency QR Broadcaster Canvas */}
        <div
          className={`flex flex-col items-center justify-center p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-6 ${
            isFullscreen ? 'lg:col-span-7 bg-slate-900/90 border-slate-700' : 'lg:col-span-6'
          }`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

          {/* Sub-header info */}
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 text-xs font-mono font-bold">
              <Zap className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
              HMAC-SHA256 SIGNED SEED • 1.0s ROTATION
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Scan with Aproxy Institutional App
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Tokens expire strictly after 2000ms. Screenshot forwarding & WhatsApp proxies are automatically rejected.
            </p>
          </div>

          {/* Central High-Contrast QR Code Card */}
          <div className="relative p-6 rounded-3xl bg-slate-950 border-2 border-brand-500/40 shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col items-center justify-center z-10">
            {/* High-Resolution QR Canvas */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl relative flex items-center justify-center">
              <QRCodeSVG
                value={qrStringValue}
                size={isFullscreen ? 320 : 256}
                level="H"
                includeMargin={false}
                className="transition-all duration-200"
              />

              {/* Center Holographic Security Shield */}
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg border-2 border-white pointer-events-none">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Heartbeat Countdown Ring & Nonce Info */}
            <div className="w-full mt-5 space-y-3">
              <div className="flex items-center justify-between px-2 text-xs font-mono">
                <span className="text-slate-400">Rotating Nonce:</span>
                <span className="text-accent-cyan font-bold tracking-wider">{displayPayload.nonce}</span>
              </div>

              {/* Countdown Progress Bar */}
              <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-accent-cyan to-accent-emerald rounded-full transition-all duration-75 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Heartbeat pulse indicators */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Next rotation in {(countdown / 1000).toFixed(1)}s
                </span>
                <span className="text-accent-emerald font-semibold">Strict 2.0s Drift Window</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Telemetry: Live Check-in Progress & Stream Audit Stream */}
        <div className={`space-y-6 ${isFullscreen ? 'lg:col-span-5' : 'lg:col-span-6'}`}>
          {/* Progress Card */}
          <div
            className={`p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-md space-y-5 ${
              isFullscreen ? 'bg-slate-900/90 border-slate-700' : ''
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Auditorium Check-in Progress
                </h3>
              </div>
              <span className="font-mono text-sm font-black text-brand-600 dark:text-brand-400">
                {totalAttended} / {totalEnrolled} ({attendanceRate}%)
              </span>
            </div>

            {/* Progress Gauge */}
            <div className="space-y-2">
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-accent-emerald rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, attendanceRate)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span className="text-emerald-500 font-bold">{totalAttended} Verified Present</span>
                <span>{Math.max(0, totalEnrolled - totalAttended)} Pending</span>
              </div>
            </div>

            {/* Security Parameters Matrix */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px]">Geofence Perimeter</span>
                <span className="font-bold text-slate-900 dark:text-white block font-mono">
                  {activeSession?.roomNumber || 'Hall B-201'} (30m)
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px]">Cryptographic Shield</span>
                <span className="font-bold text-emerald-500 block font-mono">
                  HMAC-SHA256 Nonce
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Incoming Stream Log */}
          <div
            className={`p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-md space-y-4 ${
              isFullscreen ? 'bg-slate-900/90 border-slate-700' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Audit Stream
                </h3>
              </div>
              <Badge variant="cyan" dot pulse className="text-[10px]">
                LIVE WEBSOCKET
              </Badge>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto pr-1">
              {streamLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${
                    log.status === 'VERIFIED'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold">
                      [{log.time}] {log.studentName} ({log.enrollmentNumber})
                    </div>
                    <div className="text-[11px] opacity-75">{log.method}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-black block">{log.status}</span>
                    <span className="text-[10px] opacity-80">{log.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
