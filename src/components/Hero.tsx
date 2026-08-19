import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Fingerprint,
  Radio,
  CheckCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { LiveSimulatorWidget } from './LiveSimulatorWidget';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-28 sm:pt-36 pb-20 overflow-hidden">
      {/* Ambient background glow & grid elements */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid opacity-40 dark:opacity-20 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/architecture"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 dark:border-brand-500/30 text-brand-600 dark:text-brand-300 text-xs sm:text-sm font-medium transition-all group backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-spin-slow" />
              <span>Aproxy Protocol v1.4 Released</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold group-hover:text-brand-500 transition-colors flex items-center">
                Read Whitepaper <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Hero Main Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
          >
            Eliminate Proxy Attendance.{' '}
            <span className="text-gradient">Cryptographically.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Stop WhatsApp screenshot sharing, fake GPS spoofs, and buddy punching. Aproxy pairs{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">1-second rotating HMAC-SHA256 tokens</strong> with{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">on-device 3D facial liveness</strong> for unforgeable, sub-50ms attendance verification.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <a href="#live-simulator">
              <Button
                variant="glow"
                size="lg"
                className="w-full sm:w-auto shadow-xl"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Try Live Simulator
              </Button>
            </a>

            <Link to="/architecture">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Lock className="w-4 h-4 mr-1.5 text-brand-500" />
                Explore Cryptographic Engine
              </Button>
            </Link>
          </motion.div>

          {/* Value Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>100% Anti-Screenshot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Zero Raw Biometric Storage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>&lt; 50ms Atomic Consensus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Tamper-Evident Ledger</span>
            </div>
          </motion.div>
        </div>

        {/* Live Simulator Widget Container */}
        <motion.div
          id="live-simulator"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 sm:mt-20 scroll-mt-24"
        >
          <div className="relative group">
            {/* Outer Ambient Glow Gradient */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-cyan rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            
            {/* Interactive Live Simulator */}
            <LiveSimulatorWidget />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
