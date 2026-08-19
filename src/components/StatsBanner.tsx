import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Clock, Lock } from 'lucide-react';

export const StatsBanner: React.FC = () => {
  const stats = [
    {
      value: '99.98%',
      label: 'Proxy Attendance Reduction',
      detail: 'Mathematically proven zero replay window',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      value: '< 50ms',
      label: 'Atomic Consensus Latency',
      detail: 'Real-time WebSocket verification',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      value: '1.0 sec',
      label: 'Rolling Token TTL',
      detail: 'CSPRNG-seeded dynamic HMAC',
      icon: <Clock className="w-5 h-5 text-accent-cyan" />,
    },
    {
      value: '0',
      label: 'Raw Photos Stored',
      detail: '100% Privacy & GDPR compliant',
      icon: <Lock className="w-5 h-5 text-brand-400" />,
    },
  ];

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {stat.value}
                </span>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {stat.icon}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {stat.label}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {stat.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
