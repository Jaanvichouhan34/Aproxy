import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  ScanFace,
  QrCode,
  CheckCheck,
  ArrowRight,
  Shield,
  Cpu,
  Lock,
  Zap,
  Server,
  Code,
  FileCheck,
} from 'lucide-react';
import { Badge } from './ui/Badge';

interface StepDetail {
  id: number;
  title: string;
  badge: string;
  shortDesc: string;
  icon: React.ReactNode;
  technicalDetails: {
    heading: string;
    bullets: string[];
    codePreview: string;
    cryptographicTag: string;
  };
}

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);

  const steps: StepDetail[] = [
    {
      id: 1,
      title: 'Dynamic Session & Rolling Salt',
      badge: 'Step 01 / Teacher Initiation',
      shortDesc: 'Teacher opens lecture console. Server injects rolling cryptographic salt over sub-50ms WebSockets.',
      icon: <KeyRound className="w-5 h-5" />,
      technicalDetails: {
        heading: 'Cryptographic Salt & Epoch Clock',
        bullets: [
          'High-entropy salt generated using CSPRNG on teacher session creation',
          'Epoch clock quantized into 1000ms discrete validation windows',
          'Broadcasting 60fps dynamic visual payload to lecture hall screen',
        ],
        codePreview: `// 1. Instructor Session Token Generation
const sessionSalt = crypto.randomBytes(32).toString('hex');
const epochSlot = Math.floor(Date.now() / 1000);
const hmacPayload = crypto
  .createHmac('sha256', sessionSalt)
  .update(\`\${classId}:\${epochSlot}\`)
  .digest('hex');`,
        cryptographicTag: 'HMAC-SHA256 • CSPRNG Seed',
      },
    },
    {
      id: 2,
      title: '3D Facial Liveness & Vector Match',
      badge: 'Step 02 / Student Device',
      shortDesc: 'On-device neural network verifies 3D depth mesh and pupil reaction. Zero raw images are uploaded.',
      icon: <ScanFace className="w-5 h-5" />,
      technicalDetails: {
        heading: 'Edge Biometrics & Zero-Knowledge Vectors',
        bullets: [
          '3D parallax depth validation prevents printed photo or screen spoofing',
          'Extracts 512-dimension mathematical floating-point embedding vector on-device',
          'Raw facial photos are immediately destroyed in memory—100% privacy preserving',
        ],
        codePreview: `// 2. On-Device 3D Liveness & Vectorization
const livenessScore = await FaceMesh.verify3DDepth({
  microBlinks: true,
  depthParallax: 0.94 // Min 0.85 threshold
});
const embedding512 = await MobileNetV3.extractVector(tensor);
// Vector normalized without persisting raw pixels`,
        cryptographicTag: 'TensorFlow Edge • Cosine Similarity',
      },
    },
    {
      id: 3,
      title: 'Sub-Second QR Capture',
      badge: 'Step 03 / Ephemeral Binding',
      shortDesc: 'Phone camera scans dynamic token. Payload is signed with hardware Secure Enclave key.',
      icon: <QrCode className="w-5 h-5" />,
      technicalDetails: {
        heading: 'Hardware Attestation & Anti-Replay',
        bullets: [
          'Token valid strictly for 1,000ms from the instant of projection',
          'Screenshot forwarded via messaging will expire before the recipient can scan it',
          'Device Secure Enclave signs submission with hardware private key',
        ],
        codePreview: `// 3. Hardware-Signed Check-in Envelope
const clientEnvelope = {
  token: capturedHmacToken,
  timestamp: Date.now(),
  studentId: "STU-2024-089",
  deviceSignature: await SecureEnclave.sign(capturedHmacToken)
};`,
        cryptographicTag: 'Hardware Enclave • Replay Defense',
      },
    },
    {
      id: 4,
      title: 'Atomic Consensus & Sync',
      badge: 'Step 04 / Real-Time Confirmation',
      shortDesc: 'Server checks nonce uniqueness and logs verified attendance into the tamper-evident ledger.',
      icon: <CheckCheck className="w-5 h-5" />,
      technicalDetails: {
        heading: 'Sub-30ms Verification & Ledger Append',
        bullets: [
          'Redis atomic pipeline checks single-use nonce consumption in O(1)',
          'Vector cosine similarity evaluated against student reference hash (similarity > 0.92)',
          'Attendance state broadcast to instructor dashboard in under 30 milliseconds',
        ],
        codePreview: `// 4. Atomic Server Consensus & Ledger Commit
const isValidToken = await Redis.set(
  \`nonce:\${token}\`, "consumed", "EX", 10, "NX"
);
if (!isValidToken) throw new Error("REPLAY_ATTACK_DETECTED");

await Ledger.appendVerified({ studentId, classId, timestamp });
WebSocket.broadcastToTeacher({ studentId, status: "PRESENT" });`,
        cryptographicTag: 'Redis Atomic NX • Merkle Audit Chain',
      },
    },
  ];

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % steps.length) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoPlay, steps.length]);

  const current = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="brand" dot pulse>
            UNBREAKABLE PROTOCOL
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Aproxy Works in{' '}
            <span className="text-gradient">4 Cryptographic Steps</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            From the instructor's podium to the student's device, every millisecond is verified using high-frequency rotating signatures and on-device machine intelligence.
          </p>
        </div>

        {/* Step Selector Horizontal Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {steps.map((step) => {
            const isCurrent = step.id === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStep(step.id);
                  setAutoPlay(false);
                }}
                className={`text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-white dark:bg-surface-dark border-brand-500/80 shadow-lg shadow-brand-500/10 dark:shadow-brand-500/20'
                    : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Active Top Gradient Indicator */}
                {isCurrent && (
                  <motion.div
                    layoutId="activeStepLine"
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-accent-cyan"
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">0{step.id}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {step.shortDesc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep-Dive Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl p-6 sm:p-10 overflow-hidden relative"
          >
            {/* Ambient Background Gradient for Card */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Details */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <Badge variant="brand">{current.badge}</Badge>
                  <span className="text-xs font-mono text-accent-cyan">
                    {current.technicalDetails.cryptographicTag}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {current.technicalDetails.heading}
                </h3>

                <ul className="space-y-3.5">
                  {current.technicalDetails.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5 border border-brand-500/30">
                        <CheckCheck className="w-3 h-3" />
                      </div>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveStep((prev) => (prev % steps.length) + 1)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Next Step ({activeStep === 4 ? 'Loop to 1' : `Step 0${activeStep + 1}`}){' '}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Code / Execution Visualizer */}
              <div className="lg:col-span-6">
                <div className="bg-slate-950 rounded-2xl border border-slate-800/90 shadow-inner overflow-hidden">
                  {/* Code Editor Header */}
                  <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 ml-2">
                        step_{current.id}_protocol.ts
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-slate-400 py-0">
                      TypeScript
                    </Badge>
                  </div>

                  {/* Code Body */}
                  <div className="p-5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                    <pre className="text-brand-200/90">
                      <code>{current.technicalDetails.codePreview}</code>
                    </pre>
                  </div>

                  {/* Terminal Execution Status */}
                  <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Zap className="w-3 h-3" /> Execution Status: PASS
                    </span>
                    <span>Latency: &lt; 25ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
