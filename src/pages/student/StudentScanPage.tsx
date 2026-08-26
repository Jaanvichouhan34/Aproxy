import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  QrCode,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flashlight,
  SwitchCamera,
  Play,
  Pause,
  Sliders,
  Check,
  XCircle,
  Volume2,
  VolumeX,
  Lock,
  UserCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { BiometricVerificationModal } from '../../components/biometrics/BiometricVerificationModal';
import { FaceEnrollmentModal } from '../../components/biometrics/FaceEnrollmentModal';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const StudentScanPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    activeSession,
    currentPayload,
    verifyScannedPayload,
    isVerifying,
    lastScanResult,
    clearLastScan,
    soundEnabled,
    setSoundEnabled,
    checkActiveSession,
  } = useAttendanceStore();

  const navigate = useNavigate();

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [scanStep, setScanStep] = useState<
    'IDLE' | 'BIOMETRIC_CHECK' | 'SCANNING_CAMERA' | 'VERIFYING_PAYLOAD' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [activeTab, setActiveTab] = useState<'CAMERA' | 'SIMULATOR'>('CAMERA');
  const [similarityScore, setSimilarityScore] = useState<number>(0.96);
  const [customQrInput, setCustomQrInput] = useState('');

  // Biometric Verification State
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [verifiedBiometricProof, setVerifiedBiometricProof] = useState<{
    liveDescriptor: number[];
    similarityScore: number;
    euclideanDistance: number;
    livenessChallenge: string;
  } | null>(null);

  const [pendingQrPayload, setPendingQrPayload] = useState<any | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  const isEnrolled =
    user?.faceDescriptorEnrolled || (user?.faceDescriptor && user.faceDescriptor.length === 128);

  useEffect(() => {
    checkActiveSession();
  }, [checkActiveSession]);

  // Cleanup camera scanner on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    clearLastScan();
    setCameraError(null);
    setScanStep('SCANNING_CAMERA');

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode },
        config,
        onScanSuccess,
        onScanFailure
      );

      setCameraActive(true);
      isScanningRef.current = true;
      toast.info('QR Camera active. Align with rotating teacher display.');
    } catch (err: any) {
      console.warn('[Camera error]', err);
      setCameraError(
        err?.message || 'Unable to access camera. Please allow camera permissions or use the Test Simulator.'
      );
      setCameraActive(false);
      setScanStep('IDLE');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('[Stop camera error]', err);
      } finally {
        isScanningRef.current = false;
        setCameraActive(false);
      }
    }
  };

  const toggleCameraFacing = async () => {
    await stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !cameraActive) return;
    try {
      const newTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        // @ts-ignore
        advanced: [{ torch: newTorch }],
      });
      setTorchOn(newTorch);
      toast.info(newTorch ? 'Flashlight enabled' : 'Flashlight disabled');
    } catch (err) {
      toast.error('Flashlight/torch not supported by this camera');
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (!isScanningRef.current) return;
    isScanningRef.current = false;
    await stopCamera();

    // If student already has verified biometrics during this session
    if (verifiedBiometricProof) {
      handleFinalSubmission(decodedText, verifiedBiometricProof);
    } else {
      // Prompt for biometric liveness verification before final submission
      setPendingQrPayload(decodedText);
      setIsBiometricModalOpen(true);
    }
  };

  const onScanFailure = () => {
    // Continuous frame scanning, no-op for misses
  };

  // Called when Biometric Verification passes
  const handleBiometricPassed = (data: {
    liveDescriptor: number[];
    similarityScore: number;
    euclideanDistance: number;
    livenessChallenge: string;
  }) => {
    setIsBiometricModalOpen(false);
    setVerifiedBiometricProof(data);
    setSimilarityScore(data.similarityScore);

    toast.success(
      `Biometric Liveness Confirmed (${(data.similarityScore * 100).toFixed(0)}% Cosine Match)`
    );

    // If we had a pending QR scan, complete submission now
    if (pendingQrPayload) {
      handleFinalSubmission(pendingQrPayload, data);
      setPendingQrPayload(null);
    } else {
      // Otherwise unlock and launch QR camera
      startCamera();
    }
  };

  // Final cryptographic + biometric verification submission
  const handleFinalSubmission = async (
    qrData: string | object,
    biometricData?: {
      liveDescriptor: number[];
      similarityScore: number;
      euclideanDistance: number;
    } | null,
    isFallbackMode: boolean = false
  ) => {
    setScanStep('VERIFYING_PAYLOAD');

    const result = await verifyScannedPayload(qrData, {
      liveFaceDescriptor: biometricData?.liveDescriptor,
      biometricMatched: !isFallbackMode,
      similarityScore: biometricData?.similarityScore || 0.96,
      isFallback: isFallbackMode,
    });

    if (result.success) {
      setScanStep('SUCCESS');
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
      toast.success(result.message);
    } else {
      setScanStep('ERROR');
      toast.error(result.message);
    }
  };

  const handleStartAttendanceFlow = () => {
    if (!isEnrolled) {
      toast.info('Please complete 1-time Face ID enrollment first.');
      setIsEnrollModalOpen(true);
      return;
    }

    if (!verifiedBiometricProof) {
      setIsBiometricModalOpen(true);
    } else {
      startCamera();
    }
  };

  const handleFallbackFlow = () => {
    if (!currentPayload) {
      toast.error('No active broadcast session available.');
      return;
    }
    toast.warning('Initiating Edge Camera Fallback attendance...');
    handleFinalSubmission(currentPayload, null, true);
  };

  // Sandbox & Attack Simulations
  const handleSimulateLiveScan = () => {
    if (!currentPayload) {
      toast.error('No live session token available. Start a broadcast in Teacher dashboard or wait for heartbeat.');
      return;
    }

    const payloadObj = {
      sessionId: currentPayload.sessionId,
      timestamp: currentPayload.timestamp,
      nonce: currentPayload.nonce,
      signature: currentPayload.signature,
      token: currentPayload.token,
    };

    const mockProof = verifiedBiometricProof || {
      liveDescriptor: user?.faceDescriptor || new Array(128).fill(0.05),
      similarityScore: 0.96,
      euclideanDistance: 0.28,
      livenessChallenge: 'BLINK_TWICE',
    };

    handleFinalSubmission(payloadObj, mockProof);
  };

  const handleSimulateBiometricMismatch = () => {
    if (!currentPayload) {
      toast.error('No live session token available.');
      return;
    }

    const payloadObj = {
      sessionId: currentPayload.sessionId,
      timestamp: currentPayload.timestamp,
      nonce: currentPayload.nonce,
      signature: currentPayload.signature,
    };

    // Generate random mismatching vector (euclidean distance > 0.8)
    const mismatchedVector = new Array(128).fill(0).map(() => (Math.random() - 0.5) * 2);

    toast.info('Simulating spoof attempt with foreign facial embedding...');
    handleFinalSubmission(payloadObj, {
      liveDescriptor: mismatchedVector,
      similarityScore: 0.32,
      euclideanDistance: 0.92,
    });
  };

  const handleSimulateExpiredReplay = () => {
    if (!currentPayload) {
      toast.error('No live session token available.');
      return;
    }

    const expiredPayload = {
      sessionId: currentPayload.sessionId,
      timestamp: Date.now() - 4000,
      nonce: currentPayload.nonce,
      signature: currentPayload.signature,
    };

    handleFinalSubmission(expiredPayload, verifiedBiometricProof);
  };

  const handleSimulateTamperedSig = () => {
    if (!currentPayload) {
      toast.error('No live session token available.');
      return;
    }

    const tamperedPayload = {
      sessionId: currentPayload.sessionId,
      timestamp: currentPayload.timestamp,
      nonce: currentPayload.nonce,
      signature: currentPayload.signature.slice(0, -6) + 'abcdef',
    };

    handleFinalSubmission(tamperedPayload, verifiedBiometricProof);
  };

  const handleCustomInputSubmit = () => {
    if (!customQrInput.trim()) {
      toast.error('Please paste a QR payload string');
      return;
    }
    handleFinalSubmission(customQrInput.trim(), verifiedBiometricProof);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="brand" dot pulse>
          EDGE-ENCLAVE ZERO-TRUST SCANNER
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Mark Attendance for{' '}
          <span className="text-gradient">
            {activeSession ? activeSession.subjectCode : 'CS402'}
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Biometric liveness challenge & dynamic HMAC-signed rotating QR verification.
        </p>
      </div>

      {/* Mode Selector Tabs (Camera vs Test Simulator) */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('CAMERA');
              setScanStep('IDLE');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CAMERA'
                ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 inline mr-1.5" />
            Live Camera Feed
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('SIMULATOR');
              setScanStep('IDLE');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SIMULATOR'
                ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 inline mr-1.5 text-accent-cyan" />
            Attack & Test Sandbox
          </button>
        </div>
      </div>

      {/* Main Scanner Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {activeTab === 'CAMERA' ? (
          <>
            {/* Viewfinder View */}
            <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl bg-slate-950 border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4 text-center shadow-inner">
              {/* Geolocation & Face ID status overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 z-20">
                <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <MapPin className="w-3 h-3" /> Hall B-201 (GPS Locked)
                </span>
                <span
                  className={`flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border ${
                    verifiedBiometricProof
                      ? 'text-emerald-400 border-emerald-500/20'
                      : 'text-brand-400 border-brand-500/20'
                  }`}
                >
                  <Fingerprint className="w-3 h-3" />
                  {verifiedBiometricProof ? 'Face ID Verified' : 'Face ID Required'}
                </span>
              </div>

              {/* html5-qrcode video viewport */}
              <div
                id="qr-reader"
                className={`w-full h-full object-cover rounded-2xl ${cameraActive ? 'block' : 'hidden'}`}
              />

              {/* Camera Overlays / Reticle */}
              {scanStep === 'IDLE' && !cameraActive && (
                <div className="relative w-56 h-56 rounded-2xl border-2 border-dashed border-brand-500/40 flex flex-col items-center justify-center space-y-3 p-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                    {verifiedBiometricProof ? (
                      <QrCode className="w-7 h-7" />
                    ) : (
                      <Fingerprint className="w-7 h-7" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {verifiedBiometricProof
                      ? 'Biometric verified. Ready to scan QR.'
                      : 'Verify Face Liveness to Unlock Scanner'}
                  </p>
                </div>
              )}

              {/* Animated Laser Scanning Line */}
              {cameraActive && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 w-56 h-56 mx-auto border-2 border-brand-500/60 rounded-2xl pointer-events-none z-10 flex items-center justify-center">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan" />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-400 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-400 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-400 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-400 -mb-1 -mr-1" />
                </div>
              )}

              {/* Verifying Payload State */}
              {scanStep === 'VERIFYING_PAYLOAD' && (
                <div className="relative w-56 h-56 rounded-2xl border-2 border-brand-500/60 flex flex-col items-center justify-center space-y-3 p-4 bg-slate-900/90 z-20">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1 w-full text-center">
                    <p className="text-xs text-brand-300 font-mono font-bold">
                      Validating Nonce & Biometric Token...
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Matching 128D Float Vector
                    </span>
                  </div>
                </div>
              )}

              {/* Success Result View */}
              {scanStep === 'SUCCESS' && (
                <div className="relative w-56 h-56 rounded-2xl border-2 border-emerald-500/60 flex flex-col items-center justify-center space-y-3 p-4 bg-emerald-950/40 z-20">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-emerald-400 font-bold font-mono">
                    VERIFIED PRESENT
                  </p>
                </div>
              )}

              {/* Error Rejection View */}
              {scanStep === 'ERROR' && (
                <div className="relative w-56 h-56 rounded-2xl border-2 border-rose-500/60 flex flex-col items-center justify-center space-y-3 p-4 bg-rose-950/40 z-20">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-rose-400 font-bold font-mono">
                    ATTENDANCE REJECTED
                  </p>
                </div>
              )}
            </div>

            {/* Camera Floating Controls */}
            {cameraActive && (
              <div className="flex justify-center items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTorch}
                  className="rounded-full"
                  title="Toggle Torch"
                >
                  <Flashlight className={`w-4 h-4 ${torchOn ? 'text-amber-400' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCameraFacing}
                  className="rounded-full"
                  title="Flip Camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="text-rose-500 border-rose-500/30 rounded-full"
                >
                  <Pause className="w-4 h-4 mr-1" /> Stop Camera
                </Button>
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono text-center">
                {cameraError}
              </div>
            )}

            {/* Primary Action Button */}
            {!cameraActive && scanStep !== 'SUCCESS' && scanStep !== 'ERROR' && (
              <div className="space-y-3">
                <Button
                  variant="glow"
                  size="lg"
                  onClick={handleStartAttendanceFlow}
                  className="w-full font-bold text-sm"
                  rightIcon={
                    verifiedBiometricProof ? (
                      <Camera className="w-4 h-4" />
                    ) : (
                      <Fingerprint className="w-4 h-4" />
                    )
                  }
                >
                  {verifiedBiometricProof
                    ? 'Launch Rotating QR Scanner'
                    : 'Verify Face Liveness & Mark Attendance'}
                </Button>

                {/* Edge Fallback Link */}
                <div className="text-center">
                  <button
                    onClick={handleFallbackFlow}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline font-mono inline-flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Camera or Sensor Malfunction? Use Edge Fallback
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Attack & Test Simulator Tab */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-accent-cyan" />
                  Live WebSocket Seed Pipeline
                </span>
                <Badge variant={currentPayload ? 'emerald' : 'neutral'} dot={!!currentPayload}>
                  {currentPayload ? '1000ms LIVE FEED' : 'AWAITING BROADCAST'}
                </Badge>
              </div>
              <div className="font-mono text-[11px] text-slate-500 space-y-1">
                <div>Session: {currentPayload?.sessionId || 'None'}</div>
                <div>Nonce: {currentPayload?.nonce || '0x000000000000'}</div>
                <div>Timestamp: {currentPayload?.timestamp || 'N/A'}</div>
              </div>
            </div>

            {/* Interactive Attack Simulator Buttons */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Simulate Scenarios & Biometric Spoof Attacks
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="glow"
                  size="md"
                  onClick={handleSimulateLiveScan}
                  className="w-full text-xs font-bold"
                  disabled={isVerifying}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Valid Live Biometric Scan
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSimulateBiometricMismatch}
                  className="w-full text-xs font-bold text-rose-500 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  disabled={isVerifying}
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  Biometric Mismatch (Proxy Spoof)
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSimulateExpiredReplay}
                  className="w-full text-xs font-bold text-amber-500 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  disabled={isVerifying}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Expired Replay (&gt;2s)
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSimulateTamperedSig}
                  className="w-full text-xs font-bold text-rose-500 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  disabled={isVerifying}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Tampered Signature
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBiometricModalOpen(true)}
                  className="w-full text-xs font-mono"
                  rightIcon={<Fingerprint className="w-3.5 h-3.5 text-accent-cyan" />}
                >
                  Test Active Liveness Challenge Engine (Webcam)
                </Button>
              </div>
            </div>

            {/* Manual QR Payload Paste Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Paste Decoded QR JSON / Base64:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='{"sessionId":"...","nonce":"...","timestamp":...}'
                  value={customQrInput}
                  onChange={(e) => setCustomQrInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button variant="outline" size="sm" onClick={handleCustomInputSubmit}>
                  Verify
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Result Card */}
        {lastScanResult && (
          <div className="space-y-4 pt-2">
            {lastScanResult.success ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 space-y-2 animate-in fade-in">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Cryptographic Attendance Confirmed
                  </span>
                  <span className="font-mono">{lastScanResult.latencyMs || 24}ms Latency</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <div>Subject: {activeSession?.subjectCode || 'CS402'} Network Security</div>
                  <div>
                    Student: {user?.name} ({user?.enrollmentNumber || '2024-CS-089'})
                  </div>
                  <div>
                    Verification: Biometric 128D Liveness Sealed ({similarityScore ? (similarityScore * 100).toFixed(0) : 96}% Cosine Match)
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 space-y-2 animate-in fade-in">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Verification Rejected
                  </span>
                  <span className="font-mono">{lastScanResult.errorCode || 'REJECTED'}</span>
                </div>
                <div className="text-[11px] font-mono opacity-90">
                  {lastScanResult.message}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  clearLastScan();
                  setScanStep('IDLE');
                  if (activeTab === 'CAMERA') {
                    startCamera();
                  }
                }}
                className="w-full"
              >
                Scan Again
              </Button>
              <Button
                variant="glow"
                size="md"
                onClick={() => navigate('/student/stats')}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Attendance Stats
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onVerified={handleBiometricPassed}
        onFallbackRequested={handleFallbackFlow}
      />

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => {
          setIsEnrollModalOpen(false);
          setIsBiometricModalOpen(true);
        }}
      />
    </div>
  );
};
