import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  Fingerprint,
  Radio,
  Lock,
  Database,
  MapPin,
  WifiOff,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Layers,
} from 'lucide-react';
import { Badge } from './ui/Badge';

interface FeatureCard {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  statBadge?: string;
  colSpan: string;
  glowColor: 'brand' | 'cyan' | 'emerald';
  highlightMetric: string;
}

export const FeaturesMatrix: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const features: FeatureCard[] = [
    {
      title: 'HMAC-SHA256 Ephemeral Nonces',
      category: 'Anti-Replay Security',
      description:
        'Every dynamic QR code frame contains a high-entropy rolling cryptographic signature valid for strictly 1,000ms. Forwarding a screenshot via chat or messaging fails 100% of the time.',
      icon: <Lock className="w-6 h-6 text-brand-400" />,
      colSpan: 'lg:col-span-8',
      glowColor: 'brand',
      statBadge: '1.0s TTL Window',
      highlightMetric: '0% Screenshot Replay Vulnerability',
    },
    {
      title: '3D On-Device Facial Liveness',
      category: 'Biometric Defense',
      description:
        'Edge neural models compute micro-depth parallax and pupil dilation locally. Zero facial photos leave student devices.',
      icon: <Fingerprint className="w-6 h-6 text-accent-cyan" />,
      colSpan: 'lg:col-span-4',
      glowColor: 'cyan',
      statBadge: 'Zero Raw Storage',
      highlightMetric: '512D Vector Embeddings',
    },
    {
      title: 'Sub-50ms WebSocket Broadcast',
      category: 'High Performance',
      description:
        'Auditorium-scale real-time pub/sub pipeline handles 1,000+ students scanning concurrently with zero server latency spike.',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      colSpan: 'lg:col-span-4',
      glowColor: 'brand',
      statBadge: '< 30ms Avg Ping',
      highlightMetric: '10,000+ Concurrent Nodes',
    },
    {
      title: 'Multi-Layer Geo & BLE Proximity Lock',
      category: 'Location Integrity',
      description:
        'Triangulates classroom BLE beacons, GPS bounds, and campus Wi-Fi BSSID to ensure physical presence inside the lecture hall.',
      icon: <MapPin className="w-6 h-6 text-accent-emerald" />,
      colSpan: 'lg:col-span-4',
      glowColor: 'emerald',
      statBadge: '±3m Precision',
      highlightMetric: 'No Remote VPN Bypass',
    },
    {
      title: 'Cryptographic Merkle Audit Ledger',
      category: 'Compliance & Trust',
      description:
        'Every single attendance record is chained into an immutable cryptographic ledger with teacher private key non-repudiation.',
      icon: <Database className="w-6 h-6 text-accent-violet" />,
      colSpan: 'lg:col-span-4',
      glowColor: 'brand',
      statBadge: 'Immutable Proof',
      highlightMetric: 'Exportable Audit Chain',
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="brand" dot pulse>
            ENGINEERED FOR ZERO FRAUD
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Cryptographic Defense Matrix
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            A comprehensive, multi-layer security stack designed to make proxy attendance physically and mathematically impossible.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`${feature.colSpan} relative rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/90 dark:border-slate-800/90 p-8 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 overflow-hidden flex flex-col justify-between`}
            >
              {/* Subtle ambient light on hover */}
              <div
                className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none ${
                  hoveredIdx === idx ? 'opacity-40' : 'opacity-10'
                } ${
                  feature.glowColor === 'cyan'
                    ? 'bg-accent-cyan'
                    : feature.glowColor === 'emerald'
                    ? 'bg-accent-emerald'
                    : 'bg-brand-500'
                }`}
              />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                    {feature.icon}
                  </div>
                  {feature.statBadge && (
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {feature.statBadge}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <span className="text-xs font-mono font-medium uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {feature.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {feature.highlightMetric}
                </span>
                <span className="text-brand-500 flex items-center gap-0.5">
                  Verified <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
