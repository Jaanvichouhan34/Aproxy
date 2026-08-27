import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  MapPin,
  Fingerprint,
  Save,
  CheckCircle2,
  Lock,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

export const TeacherSettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  const [nonceDuration, setNonceDuration] = useState('1000');
  const [geofenceRadius, setGeofenceRadius] = useState('25');
  const [biometricThreshold, setBiometricThreshold] = useState('0.90');
  const [allowLateGracePeriod, setAllowLateGracePeriod] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Zero-Trust security parameters updated successfully');
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Security & Nonce Calibration
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Configure real-time anti-proxy constraints, cryptographic lifetimes, and biometric tolerances
        </p>
      </div>

      {/* Security Parameters Form */}
      <div className="space-y-6">
        {/* Card 1: Cryptographic Nonce Seed */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dynamic QR Nonce Expiration
              </h3>
              <p className="text-[11px] text-slate-400">
                Frequency at which classroom QR seeds rotate to prevent screenshot forwarding
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: '500ms (Hyper-Secure)', value: '500', desc: 'Ultra-low latency auditorium networks' },
              { label: '1000ms (Recommended)', value: '1000', desc: 'Optimal standard for campus Wi-Fi' },
              { label: '2000ms (Relaxed)', value: '2000', desc: 'High network congestion tolerance' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNonceDuration(opt.value)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  nonceDuration === opt.value
                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 text-slate-900 dark:text-white ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="font-bold text-xs block mb-1">{opt.label}</span>
                <span className="text-[11px] text-slate-400 block">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Geofence & Biometric Constraints */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Auditorium Geofencing & Biometrics
              </h3>
              <p className="text-[11px] text-slate-400">
                Spatial boundaries and cosine similarity verification threshold
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span>Geofence Maximum Distance Radius</span>
                <span className="font-mono text-brand-500 font-bold">{geofenceRadius} Meters</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Enforces that scanning devices must reside physically inside the classroom coordinates.
              </span>
            </div>

            <div className="pt-3">
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span>Face Biometric Cosine Similarity Threshold</span>
                <span className="font-mono text-emerald-500 font-bold">
                  {biometricThreshold} Match
                </span>
              </div>
              <input
                type="range"
                min="0.80"
                max="0.99"
                step="0.01"
                value={biometricThreshold}
                onChange={(e) => setBiometricThreshold(e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Zero facial images sent to server. 128D mathematical vectors matched on-device.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Account Profile Information */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-accent-violet/10 text-accent-violet flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Faculty Instructor Profile
              </h3>
              <p className="text-[11px] text-slate-400">Institutional credentials and department</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Full Legal Name</label>
              <input
                type="text"
                disabled
                value={user?.name || 'Prof. Marcus Thorne'}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Institutional Email</label>
              <input
                type="text"
                disabled
                value={user?.email || 'prof.thorne@university.edu'}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <Button
            variant="glow"
            size="md"
            onClick={handleSaveSettings}
            isLoading={isSaving}
            rightIcon={<Save className="w-4 h-4" />}
          >
            Save Security Policy
          </Button>
        </div>
      </div>
    </div>
  );
};
