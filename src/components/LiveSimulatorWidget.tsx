import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  Camera,
  Activity,
  Play,
  Pause,
  KeyRound,
  Radio,
  Clock,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { DynamicQRCode } from './DynamicQRCode';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import confetti from 'canvas-confetti';

type AttackMode = 'legit' | 'screenshot' | 'photo_spoof' | 'geo_spoof';

interface AttendanceRecord {
  id: string;
  studentName: string;
  rollNo: string;
  timestamp: string;
  latencyMs: number;
  status: 'verified' | 'rejected';
  reason?: string;
  hmacSignature: string;
}

export const LiveSimulatorWidget: React.FC = () => {
  const [nonce, setNonce] = useState(10482);
  const [salt, setSalt] = useState('7f8a9b');
  const [timeLeftMs, setTimeLeftMs] = useState(1000);
  const [isRunning, setIsRunning] = useState(true);
  const [connectedCount, setConnectedCount] = useState(78);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verified' | 'rejected'>('idle');
  const [attackMode, setAttackMode] = useState<AttackMode>('legit');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [activeLog, setActiveLog] = useState<string[]>([]);
  const [verifiedStudent, setVerifiedStudent] = useState<AttendanceRecord | null>(null);

  const timerRef = useRef<number | null>(null);

  // 1-second rotating QR loop with high-precision timestamp
  useEffect(() => {
    if (!isRunning) return;

    const interval = 50; // update progress every 50ms
    timerRef.current = window.setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 50) {
          // Generate new dynamic token
          setNonce((n) => (n + 1) % 99999);
          return 1000;
        }
        return prev - interval;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Push crypto telemetry log
  const pushLog = (msg: string) => {
    setActiveLog((prev) => [
      `[${new Date().toISOString().substring(11, 23)}] ${msg}`,
      ...prev.slice(0, 7),
    ]);
  };

  useEffect(() => {
    pushLog(`HMAC_INIT: Session seed updated to salt_${salt} with cycle 1000ms`);
  }, [salt]);

  // Current HMAC string preview
  const currentToken = `APX-${salt}-${nonce.toString().padStart(5, '0')}-${Math.floor(Date.now() / 1000)}`;

  const handleScanAction = (mode: AttackMode = attackMode) => {
    setScanState('scanning');
    pushLog(`CLIENT_REQ: Biometric & QR payload received from device #STU-992`);

    setTimeout(() => {
      if (mode === 'screenshot') {
        setScanState('rejected');
        const reason = 'ANTI-REPLAY: Token expired (age 2,840ms > 1,000ms limit)';
        setRejectionMessage(reason);
        pushLog(`❌ REJECT: ${reason}`);
      } else if (mode === 'photo_spoof') {
        setScanState('rejected');
        const reason = 'BIOMETRIC_FAIL: 3D Depth Map parallax score 0.18 < 0.85 (Static 2D image)';
        setRejectionMessage(reason);
        pushLog(`❌ REJECT: ${reason}`);
      } else if (mode === 'geo_spoof') {
        setScanState('rejected');
        const reason = 'PROXIMITY_FAIL: BLE RSSI signal attenuation indicates > 65m from classroom anchor';
        setRejectionMessage(reason);
        pushLog(`❌ REJECT: ${reason}`);
      } else {
        // Legit verification success
        setScanState('verified');
        const record: AttendanceRecord = {
          id: `REC-${Date.now().toString().slice(-4)}`,
          studentName: 'Alex Rivera',
          rollNo: '2024-CS-089',
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: Math.floor(Math.random() * 15) + 18,
          status: 'verified',
          hmacSignature: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
        };
        setVerifiedStudent(record);
        setConnectedCount((c) => c + 1);
        pushLog(`✅ CONSENSUS_OK: Attendance recorded atomically for Alex Rivera [24ms]`);

        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#6366F1', '#06B6D4', '#10B981'],
          });
        } catch {
          // ignore if unavailable
        }
      }
    }, 600);
  };

  const handleReset = () => {
    setScanState('idle');
    setVerifiedStudent(null);
    setRejectionMessage('');
  };

  return (
    <div className="w-full rounded-3xl bg-slate-900/90 text-white border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-2xl">
      {/* Simulator Header Bar */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-accent-emerald" />
            LIVE SIMULATION SANDBOX
          </div>
          <span className="text-slate-400 text-xs hidden md:inline">
            • Real-time rotating cryptographic engine preview
          </span>
        </div>

        {/* Attack Vector Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">
            Test Scenario:
          </span>
          <button
            onClick={() => {
              setAttackMode('legit');
              handleReset();
            }}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              attackMode === 'legit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            ✅ Legit Student
          </button>
          <button
            onClick={() => {
              setAttackMode('screenshot');
              handleReset();
            }}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              attackMode === 'screenshot'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            🚫 Screenshot Replay
          </button>
          <button
            onClick={() => {
              setAttackMode('photo_spoof');
              handleReset();
            }}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              attackMode === 'photo_spoof'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            🚫 Photo Spoof
          </button>
        </div>
      </div>

      {/* Main Dual-View Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* LEFT COLUMN: Teacher Classroom Projector */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold tracking-wide text-slate-200">
                  TEACHER PODIUM DISPLAY
                </span>
              </div>
              <Badge variant="success" dot pulse>
                Broadcasting (1.0s Cycle)
              </Badge>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Class:</span>
                <span className="font-semibold text-slate-200">CS 402: Distributed Systems</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Verified Present:</span>
                <span className="font-mono text-emerald-400 font-semibold">{connectedCount} / 80 Enrolled</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">HMAC Dynamic Salt:</span>
                <span className="font-mono text-brand-300 bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-800/40">
                  {salt}
                </span>
              </div>
            </div>

            {/* Interactive QR Display Frame */}
            <div className="relative flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              {/* Rotating QR Visual */}
              <div className="relative">
                <DynamicQRCode data={currentToken} size={200} />
                
                {/* 1-Second Countdown Progress Ring Overlay */}
                <div className="absolute -inset-2 pointer-events-none rounded-2xl border-2 border-dashed border-brand-500/30 animate-spin-slow" />
              </div>

              {/* Progress Bar for 1-Second Ephemeral Lifecycle */}
              <div className="w-full max-w-xs mt-5">
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-400" />
                    Token TTL (1000ms):
                  </span>
                  <span className="text-brand-300 font-semibold">{timeLeftMs}ms remaining</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan"
                    style={{ width: `${(timeLeftMs / 1000) * 100}%` }}
                    transition={{ ease: 'linear', duration: 0.05 }}
                  />
                </div>
              </div>

              {/* Token Hash String */}
              <div className="mt-3 text-center">
                <span className="text-[10px] font-mono text-slate-500 block">ENCRYPTED PAYLOAD</span>
                <code className="text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 inline-block mt-0.5">
                  {currentToken}
                </code>
              </div>
            </div>
          </div>

          {/* Teacher Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? 'Pause Session' : 'Resume Broadcast'}
            </button>
            <button
              onClick={() => {
                setSalt(Math.random().toString(36).substring(2, 8));
                setNonce(10000 + Math.floor(Math.random() * 80000));
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Rotate Salt
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Student Smartphone Scanner & Verification */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-slate-950/30 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-accent-cyan" />
                <span className="text-sm font-semibold tracking-wide text-slate-200">
                  STUDENT SMARTPHONE SCANNER
                </span>
              </div>
              <Badge variant="neutral">Device #STU-992</Badge>
            </div>

            {/* Mobile Viewfinder Simulated Screen */}
            <div className="relative bg-slate-950 rounded-2xl border-2 border-slate-800 p-5 flex flex-col items-center justify-center min-h-[310px] overflow-hidden">
              {/* Background camera grid simulation */}
              <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

              <AnimatePresence mode="wait">
                {scanState === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center text-center space-y-4 py-4 z-10"
                  >
                    {/* Viewfinder Reticle */}
                    <div className="relative w-44 h-44 rounded-2xl border-2 border-dashed border-accent-cyan/60 flex items-center justify-center bg-accent-cyan/5">
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent-cyan" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent-cyan" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent-cyan" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent-cyan" />

                      {/* Laser scan line animation */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent animate-scan" />

                      <div className="flex flex-col items-center text-center space-y-1.5 p-2">
                        <Camera className="w-8 h-8 text-accent-cyan/80 animate-pulse-subtle" />
                        <span className="text-[11px] font-medium text-slate-300">
                          Align QR in Frame
                        </span>
                        <span className="text-[10px] text-slate-400">3D Face Check Active</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>3D Facial Liveness: <strong>Active (Local Edge)</strong></span>
                    </div>
                  </motion.div>
                )}

                {scanState === 'scanning' && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center space-y-4 py-8 z-10"
                  >
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/10 border-2 border-brand-500">
                      <Zap className="w-8 h-8 text-brand-400 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Validating Cryptographic Nonce...</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Evaluating HMAC hash & cosine vector embedding
                      </p>
                    </div>
                  </motion.div>
                )}

                {scanState === 'verified' && verifiedStudent && (
                  <motion.div
                    key="verified"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex flex-col items-center text-center space-y-3 py-2 z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                        Attendance Recorded! <Sparkles className="w-4 h-4 text-amber-400" />
                      </h4>
                      <p className="text-xs text-slate-400">Atomic consensus verified in {verifiedStudent.latencyMs}ms</p>
                    </div>

                    <div className="w-full bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-left space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Student:</span>
                        <span className="font-semibold text-white">{verifiedStudent.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Roll Number:</span>
                        <span className="font-mono text-brand-300">{verifiedStudent.rollNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timestamp:</span>
                        <span className="font-mono text-slate-300">{verifiedStudent.timestamp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ledger Sig:</span>
                        <span className="font-mono text-emerald-400">{verifiedStudent.hmacSignature}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {scanState === 'rejected' && (
                  <motion.div
                    key="rejected"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex flex-col items-center text-center space-y-3 py-2 z-10"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/30">
                      <ShieldAlert className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-rose-400">Proxy Attempt Blocked!</h4>
                      <p className="text-xs text-slate-300 mt-1 max-w-xs">{rejectionMessage}</p>
                    </div>

                    <div className="w-full bg-rose-950/40 rounded-xl p-3 border border-rose-500/30 text-left text-xs font-mono text-rose-300">
                      <p className="text-[11px] font-bold text-rose-200">DEFENSE AUDIT FLAG:</p>
                      <p className="text-[10px] mt-0.5">Status: 403 Forbidden | Severity: HIGH</p>
                      <p className="text-[10px]">Incident logged to faculty audit trail.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Student Actions Bar */}
          <div className="flex items-center gap-3 pt-2">
            {scanState === 'idle' ? (
              <Button
                onClick={() => handleScanAction(attackMode)}
                variant="glow"
                size="md"
                className="w-full font-semibold"
                leftIcon={<Camera className="w-4 h-4" />}
              >
                {attackMode === 'legit'
                  ? '⚡ Scan Rotating QR Code'
                  : attackMode === 'screenshot'
                  ? '⚠️ Attempt Screenshot Scan'
                  : '⚠️ Attempt Photo Spoof Scan'}
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="secondary"
                size="md"
                className="w-full"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reset Scanner
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Cryptographic Telemetry Stream */}
      <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
          <span className="flex items-center gap-1.5 text-brand-400">
            <Terminal className="w-3.5 h-3.5" />
            CRYPTOGRAPHIC AUDIT FEED (HMAC-SHA256 & CONSENSUS)
          </span>
          <span className="text-[11px] text-slate-500">Sub-50ms WebSocket Broadcast</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 max-h-24 overflow-y-auto">
          {activeLog.map((log, idx) => (
            <div
              key={idx}
              className={`${
                log.includes('REJECT')
                  ? 'text-rose-400 font-semibold'
                  : log.includes('CONSENSUS_OK')
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
