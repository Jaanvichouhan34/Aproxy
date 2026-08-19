import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Lock,
  Smartphone,
  Image,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';
import { Badge } from './ui/Badge';

interface AttackVector {
  id: string;
  name: string;
  category: string;
  description: string;
  traditionalVulnerability: string;
  aproxyDefense: string;
  defenseMechanism: string;
  icon: React.ReactNode;
}

export const ThreatDefense: React.FC = () => {
  const [selectedVector, setSelectedVector] = useState<string>('screenshot');

  const attackVectors: AttackVector[] = [
    {
      id: 'screenshot',
      name: 'WhatsApp QR Screenshot Forwarding',
      category: 'Replay Attack',
      description: 'A student in the classroom takes a screenshot of the QR and sends it to an absent roommate.',
      traditionalVulnerability: 'Accepted. Static QR codes have unlimited or multi-minute validity.',
      aproxyDefense: 'Blocked instantly. Ephemeral HMAC QR rotates every 1,000ms; token is dead before delivery.',
      defenseMechanism: '1-Second Rolling HMAC Nonce + CSPRNG Seed',
      icon: <Share2 className="w-5 h-5" />,
    },
    {
      id: 'photo_spoof',
      name: '2D Printed Photo / Screen Replay',
      category: 'Biometric Spoof',
      description: 'Student holds an iPad displaying a classmate’s portrait in front of the scanner camera.',
      traditionalVulnerability: 'Accepted. Simple 2D face detection models cannot verify real depth.',
      aproxyDefense: 'Blocked. Real-time 3D parallax depth mesh and micro-blink analysis detect 2D flat surfaces.',
      defenseMechanism: 'On-Device 3D Neural Depth Parallax Model',
      icon: <Image className="w-5 h-5" />,
    },
    {
      id: 'buddy_punch',
      name: 'Multi-Account Buddy Punching',
      category: 'Identity Fraud',
      description: 'One student carries multiple smartphones to scan for 3 different absent friends.',
      traditionalVulnerability: 'Accepted. Traditional apps only check credentials without active biometrics.',
      aproxyDefense: 'Blocked. Every scan requires synchronized 3D facial verification matched to enrollment vector.',
      defenseMechanism: 'Cosine Similarity Vector Verification (>0.92 threshold)',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'gps_spoof',
      name: 'Mock Location & Virtual GPS Spoofing',
      category: 'Geo Spoof',
      description: 'Student uses an Android mock GPS provider app to simulate being at university coordinates.',
      traditionalVulnerability: 'Accepted. Standard apps rely solely on OS GPS coordinates.',
      aproxyDefense: 'Blocked. Multi-factor proximity binds Bluetooth Low Energy (BLE) RSSI anchors and classroom BSSID.',
      defenseMechanism: 'BLE RSSI Signal Attenuation & Physical Anchor Pinning',
      icon: <MapPin className="w-5 h-5" />,
    },
  ];

  const current = attackVectors.find((v) => v.id === selectedVector) || attackVectors[0];

  return (
    <section id="threat-defense" className="py-24 relative bg-slate-50/50 dark:bg-surface-darker/50 border-y border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="danger" dot pulse>
            THREAT MODEL
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Aproxy Defeats Every Proxy Vector
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Compare standard vulnerable attendance methods side-by-side with Aproxy's cryptographic protocol.
          </p>
        </div>

        {/* Interactive Threat Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Attack Vector Tabs */}
          <div className="lg:col-span-5 space-y-3">
            {attackVectors.map((v) => {
              const isSelected = v.id === selectedVector;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVector(v.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-surface-dark border-brand-500 shadow-md shadow-brand-500/10'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {v.icon}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-rose-500">
                      {v.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {v.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {v.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Comparative Defense Deep-Dive */}
          <div className="lg:col-span-7">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase">Scenario</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {current.name}
                  </h3>
                </div>
                <Badge variant="neutral">{current.category}</Badge>
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Traditional Method Box */}
                <div className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider">
                    <XCircle className="w-4 h-4" /> Traditional Attendance
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {current.traditionalVulnerability}
                  </p>
                  <div className="text-[11px] font-mono text-rose-500 font-bold pt-1">
                    RESULT: ⚠️ PROXY SUCCEEDS
                  </div>
                </div>

                {/* Aproxy Protocol Box */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> Aproxy Defense
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {current.aproxyDefense}
                  </p>
                  <div className="text-[11px] font-mono text-emerald-500 font-bold pt-1">
                    RESULT: 🛡️ ATTACK DEFLECTED
                  </div>
                </div>
              </div>

              {/* Underlying Cryptographic Primitive */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-brand-400" />
                  Underlying Defense Primitive:
                </span>
                <p className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-300">
                  {current.defenseMechanism}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
