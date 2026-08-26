import React, { useState } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  Camera,
  CheckCircle2,
  RefreshCw,
  Lock,
  Sparkles,
  Zap,
  Cpu,
  Key,
  Shield,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { FaceEnrollmentModal } from '../../components/biometrics/FaceEnrollmentModal';
import { BiometricVerificationModal } from '../../components/biometrics/BiometricVerificationModal';
import { VectorVisualizer } from '../../components/biometrics/VectorVisualizer';
import { toast } from 'sonner';

export const StudentFaceIdPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{
    similarityScore: number;
    euclideanDistance: number;
    challenge: string;
  } | null>(null);

  const isEnrolled = user?.faceDescriptorEnrolled || (user?.faceDescriptor && user.faceDescriptor.length === 128);

  const handleTestVerified = (data: {
    liveDescriptor: number[];
    similarityScore: number;
    euclideanDistance: number;
    livenessChallenge: string;
  }) => {
    setIsTestModalOpen(false);
    setLastTestResult({
      similarityScore: data.similarityScore,
      euclideanDistance: data.euclideanDistance,
      challenge: data.livenessChallenge,
    });
    toast.success(
      `Biometric Match Confirmed (${(data.similarityScore * 100).toFixed(1)}% Cosine Similarity)`
    );
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="brand" dot pulse className="text-[10px]">
            EDGE NEURAL BIOMETRICS
          </Badge>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Client-Side Face ID Biometric Enclave
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Cryptographic zero-image biometric template extraction & anti-spoof liveness verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Vector Status & Enclave Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Enrolled Biometric Template
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Wasm + TensorFlow.js Descriptor
                  </span>
                </div>
              </div>
              <Badge
                variant={isEnrolled ? 'emerald' : 'warning'}
                dot
                pulse={!!isEnrolled}
                className="text-[10px]"
              >
                {isEnrolled ? 'ACTIVE & SEALED' : 'NOT ENROLLED'}
              </Badge>
            </div>

            {/* Enrolled Identity Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] block">Enrolled Identity</span>
                <span className="font-bold text-slate-900 dark:text-white block font-mono truncate">
                  {user?.name || 'Alex Rivera'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {user?.enrollmentNumber || '2024-CS-089'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] block">Template Dimensions</span>
                <span className="font-mono text-brand-500 font-bold block">
                  128-Dimensional Float32
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Euclidean Norm: ~1.000 (Unit Vector)
                </span>
              </div>
            </div>

            {/* 128D Vector Heatmap Visualizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
                  Hardware Enclave Vector State
                </span>
              </div>
              <VectorVisualizer
                vector={user?.faceDescriptor}
                label="128D Facial Landmark Embedding"
              />
            </div>

            {/* Test Match Actions */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsTestModalOpen(true)}
                  className="w-full text-xs font-bold"
                  rightIcon={<Zap className="w-4 h-4 text-accent-cyan" />}
                >
                  Test Live Biometric Match
                </Button>

                <Button
                  variant="glow"
                  size="md"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="w-full text-xs font-bold"
                  rightIcon={<Camera className="w-4 h-4" />}
                >
                  {isEnrolled ? 'Re-enroll Face Biometrics' : 'Enroll Face Biometrics'}
                </Button>
              </div>

              {lastTestResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Live Match Verified
                    </span>
                    <span className="font-mono text-sm">
                      {(lastTestResult.similarityScore * 100).toFixed(1)}% Cosine Match
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono opacity-90">
                    <span>Euclidean Distance: {lastTestResult.euclideanDistance.toFixed(4)} (&lt; 0.45 threshold)</span>
                    <span>Passed Challenge: {lastTestResult.challenge}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Zero-Image Privacy & Cryptographic Security */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Zero-Image Privacy Guarantee
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  GDPR & Cryptographic Compliance
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-accent-cyan" />
                  1. Zero Image Transmission
                </strong>
                <p className="text-[11px]">
                  No photographs, video streams, or raw pixels ever leave your device. Only
                  mathematical spatial coordinates are extracted locally.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 text-xs font-bold">
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  2. Edge Neural Processing
                </strong>
                <p className="text-[11px]">
                  Facial landmark detection and 68-point feature mapping run entirely inside your
                  browser via WebAssembly and WebGL shaders.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 text-xs font-bold">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  3. Non-Invertible Embeddings
                </strong>
                <p className="text-[11px]">
                  The 128-dimensional Float32 vector is mathematically one-way. It is impossible to
                  reconstruct an image of your face from the vector coordinates.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 text-xs font-bold">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  4. Active Optical Anti-Spoofing
                </strong>
                <p className="text-[11px]">
                  Optical Eye Aspect Ratio (EAR) and head yaw tracking detect and reject static
                  photographs, screen replays, and deepfakes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => {
          setIsEnrollModalOpen(false);
          toast.success('Face biometric vector successfully updated in your profile!');
        }}
      />

      {/* Biometric Verification & Liveness Test Modal */}
      <BiometricVerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onVerified={handleTestVerified}
      />
    </div>
  );
};
