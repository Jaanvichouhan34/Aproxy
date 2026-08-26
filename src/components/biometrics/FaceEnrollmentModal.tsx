import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
  Sun,
  Maximize2,
  Users,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { VectorVisualizer } from './VectorVisualizer';
import { useAuthStore } from '../../store/useAuthStore';
import {
  loadBiometricModels,
  detectSingleFaceWithDescriptor,
  detectAllFacesInFrame,
  checkFaceQuality,
  averageDescriptors,
  QualityCheckResult,
} from '../../lib/faceApi';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (descriptor: number[]) => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, saveFaceDescriptor } = useAuthStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isEnrollingRef = useRef<boolean>(false);

  const [modelsLoading, setModelsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [quality, setQuality] = useState<QualityCheckResult>({
    isValid: false,
    isCentered: false,
    isLightingGood: false,
    brightness: 128,
    isSizeGood: false,
    faceCount: 0,
    issues: [],
  });

  const [captureProgress, setCaptureProgress] = useState(0); // 0 to 100
  const [capturedDescriptors, setCapturedDescriptors] = useState<Float32Array[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [finalDescriptor, setFinalDescriptor] = useState<number[] | null>(null);

  const REQUIRED_SAMPLES = 5;

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera and model loading
  const startEnrollment = useCallback(async () => {
    setCameraError(null);
    setEnrollmentComplete(false);
    setCapturedDescriptors([]);
    setCaptureProgress(0);
    setFinalDescriptor(null);
    isEnrollingRef.current = true;

    try {
      setModelsLoading(true);
      const loaded = await loadBiometricModels();
      setModelsLoading(false);

      if (!loaded) {
        setCameraError('Failed to load edge biometric neural networks.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.warn('[FaceEnrollmentModal camera error]', err);
      setCameraError(
        err?.message || 'Unable to access front webcam. Please allow camera permissions.'
      );
      setCameraActive(false);
    }
  }, []);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      startEnrollment();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startEnrollment, stopCamera]);

  // Main Detection & Multi-Frame Capture Loop
  useEffect(() => {
    if (!cameraActive || enrollmentComplete) return;

    let isProcessing = false;
    let localDescriptors: Float32Array[] = [];

    const processFrame = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (!isProcessing) {
        isProcessing = true;
        try {
          const video = videoRef.current;
          const [singleFace, allFaces] = await Promise.all([
            detectSingleFaceWithDescriptor(video),
            detectAllFacesInFrame(video),
          ]);

          const qualityCheck = checkFaceQuality(
            video,
            singleFace ? singleFace.detection : null,
            allFaces.length
          );

          setQuality(qualityCheck);

          // If frame meets strict biometric quality & single face requirements
          if (qualityCheck.isValid && singleFace && singleFace.descriptor) {
            localDescriptors.push(singleFace.descriptor);
            setCapturedDescriptors([...localDescriptors]);

            const progress = Math.min(
              100,
              Math.round((localDescriptors.length / REQUIRED_SAMPLES) * 100)
            );
            setCaptureProgress(progress);

            // Reached required stable sample count
            if (localDescriptors.length >= REQUIRED_SAMPLES) {
              const averaged = averageDescriptors(localDescriptors);
              setFinalDescriptor(averaged);
              setEnrollmentComplete(true);
              stopCamera();
              handleSaveDescriptor(averaged);
              return;
            }
          } else {
            // Frame not valid: slight reset if lost face
            if (localDescriptors.length > 0 && !singleFace) {
              localDescriptors = [];
              setCapturedDescriptors([]);
              setCaptureProgress(0);
            }
          }
        } catch (err) {
          console.warn('[Frame analysis loop error]', err);
        } finally {
          isProcessing = false;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, enrollmentComplete, stopCamera]);

  const handleSaveDescriptor = async (descriptor: number[]) => {
    setIsSaving(true);
    try {
      const res = await saveFaceDescriptor(descriptor);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success('128D Face Biometric vector enrolled in hardware enclave!');
        if (onSuccess) {
          onSuccess(descriptor);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error('Failed to save biometric vector.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edge Biometric Face Enrollment
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                128D Vector Extraction & Zero-Image Guarantee
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {!enrollmentComplete ? (
            <>
              {/* Webcam Viewport with Oval Biometric Reticle */}
              <div className="relative w-full aspect-[4/3] max-w-md mx-auto rounded-3xl bg-slate-950 border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    cameraActive ? 'block' : 'hidden'
                  }`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Loading State */}
                {modelsLoading && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 text-center p-4">
                    <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
                    <p className="text-xs text-slate-300 font-mono">
                      Initializing WebAssembly & Neural Biometric Weights...
                    </p>
                  </div>
                )}

                {/* Camera Reticle Overlay */}
                {cameraActive && !modelsLoading && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    {/* Oval Face Guide */}
                    <div
                      className={`relative w-48 h-64 sm:w-56 sm:h-72 rounded-[48%] border-2 transition-all duration-200 flex items-center justify-center ${
                        quality.isValid
                          ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                          : 'border-brand-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      }`}
                    >
                      {/* Scanning Laser Beam */}
                      <div
                        className={`absolute inset-x-0 h-0.5 shadow-[0_0_12px_#22d3ee] animate-scan ${
                          quality.isValid
                            ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399]'
                            : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                        }`}
                      />

                      {/* Reticle Corner Ticks */}
                      <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-white/70" />
                      <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-white/70" />
                      <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-white/70" />
                      <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-white/70" />
                    </div>

                    {/* Real-time Status Badge Floating on Video */}
                    <div className="absolute bottom-3 inset-x-4 flex justify-center">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold backdrop-blur-md border flex items-center gap-1.5 shadow-lg ${
                          quality.isValid
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900/85 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {quality.isValid ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                            Capturing Stable Biometric Vector... ({captureProgress}%)
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            {quality.issues[0] || 'Align face with oval reticle'}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Camera Permission / Error Fallback */}
                {cameraError && (
                  <div className="p-6 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                    <p className="text-xs text-rose-300 font-mono">{cameraError}</p>
                    <Button variant="outline" size="sm" onClick={startEnrollment}>
                      Retry Camera Access
                    </Button>
                  </div>
                )}
              </div>

              {/* Real-time Diagnostic Badges */}
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                {/* Lighting Check */}
                <div
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
                    quality.isLightingGood
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[10px] block opacity-80">Lighting</span>
                    <strong className="block truncate">
                      {quality.brightness < 45
                        ? 'Too Dark'
                        : quality.brightness > 230
                        ? 'Overexposed'
                        : 'Optimal'}
                    </strong>
                  </div>
                </div>

                {/* Alignment Check */}
                <div
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
                    quality.isCentered && quality.isSizeGood
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Maximize2 className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[10px] block opacity-80">Position</span>
                    <strong className="block truncate">
                      {quality.isCentered ? 'Centered' : 'Re-center'}
                    </strong>
                  </div>
                </div>

                {/* Single Person Check */}
                <div
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 ${
                    quality.faceCount === 1
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[10px] block opacity-80">Subjects</span>
                    <strong className="block truncate">
                      {quality.faceCount === 1
                        ? '1 Detected'
                        : quality.faceCount === 0
                        ? 'No Face'
                        : `${quality.faceCount} Detected`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Multi-frame Capture Progress Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">Enclave Multi-Frame Averaging</span>
                  <span className="font-bold text-brand-500">
                    {capturedDescriptors.length} / {REQUIRED_SAMPLES} Frames ({captureProgress}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-200"
                    style={{ width: `${captureProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Enrollment Success View */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Biometric Face Vector Enrolled</h4>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    128-dimensional Float32 embedding extracted and sealed into hardware enclave.
                  </p>
                </div>
              </div>

              {/* Vector Heatmap Visualizer */}
              {finalDescriptor && (
                <VectorVisualizer
                  vector={finalDescriptor}
                  label="Enrolled 128D Float32 Biometric Vector"
                />
              )}

              {/* Privacy Confirmation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Image Guarantee:</strong> No video frames or photographic pixels
                  were stored or transmitted. Only the 128D mathematical embedding is saved.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-accent-cyan" />
            Client-Side FaceAPI + WebAssembly
          </div>

          <div className="flex gap-2">
            {enrollmentComplete ? (
              <Button variant="glow" size="md" onClick={onClose} className="text-xs font-bold">
                Done & Finish
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
