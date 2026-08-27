import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, AlertTriangle, TrendingUp, Calendar, ShieldCheck, Zap, Clock, MapPin, Layers } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

export const StudentStatsPage: React.FC = () => {
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/attendance/history/student');
        if (res.data.success && res.data.records) {
          setHistoryRecords(res.data.records);
        }
      } catch (err) {
        // Fallback default records
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const courses = [
    {
      code: 'CS402',
      name: 'Network Security & Applied Cryptography',
      attended: 14 + historyRecords.filter((r) => r.subjectId?.code === 'CS402').length,
      total: 14 + (historyRecords.filter((r) => r.subjectId?.code === 'CS402').length > 0 ? 1 : 0),
      rate: 100.0,
      safeToMiss: 3,
      status: 'SAFE',
    },
    {
      code: 'CS405',
      name: 'Distributed Systems & Fault Tolerance',
      attended: 11,
      total: 12,
      rate: 91.7,
      safeToMiss: 2,
      status: 'SAFE',
    },
    {
      code: 'CS409',
      name: 'Zero-Knowledge Identity Protocols',
      attended: 9,
      total: 10,
      rate: 90.0,
      safeToMiss: 1,
      status: 'SAFE',
    },
    {
      code: 'CS402-LAB',
      name: 'Cryptanalysis & Penetration Testing Lab',
      attended: 8,
      total: 8,
      rate: 100.0,
      safeToMiss: 1,
      status: 'SAFE',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Attendance Analytics & Health Score
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Threshold monitoring against institutional 75% minimum debarment policy
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-medium text-slate-500">Overall Attendance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              95.8%
            </span>
            <span className="text-xs text-emerald-500 font-semibold font-mono">Excellent</span>
          </div>
          <p className="text-[11px] text-slate-400">Total {42 + historyRecords.length} attended out of {44 + (historyRecords.length > 0 ? 1 : 0)} lectures</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-medium text-slate-500">Safe Bunk Margin</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-brand-500 font-mono">
              +7 Classes
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            You can miss up to 7 lectures across all subjects before reaching 75%
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-medium text-slate-500">Anti-Proxy Integrity</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-accent-cyan font-mono">
              100%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            0 proxy flags recorded. {42 + historyRecords.length} verified cryptographic signatures.
          </p>
        </div>
      </div>

      {/* Course-by-Course Breakdown */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Subject-Wise Attendance Breakdown
          </h3>
          <Badge variant="emerald" className="text-[10px]">
            ALL COURSES SAFE
          </Badge>
        </div>

        <div className="space-y-6">
          {courses.map((c) => (
            <div key={c.code} className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    {c.code}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-slate-500">
                  <span>{c.attended} / {c.total} classes</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.rate}%</span>
                  <span className="text-slate-400 text-[11px]">(Safe to miss {c.safeToMiss})</span>
                </div>
              </div>

              {/* Progress Bar with 75% cutoff indicator */}
              <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-rose-500/50 z-10" title="75% Minimum Threshold" />
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-accent-emerald rounded-full transition-all duration-500"
                  style={{ width: `${c.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cryptographic Verification Audit Records */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Cryptographic Check-in Audit Stream
            </h3>
          </div>
          <Badge variant="brand" className="text-[10px]">
            IMMUTABLE
          </Badge>
        </div>

        <div className="space-y-2.5">
          {historyRecords.length > 0 ? (
            historyRecords.map((rec) => (
              <div
                key={rec._id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-mono font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {rec.subjectId?.code || 'CS402'} — {rec.subjectId?.name || 'Network Security'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                      <span>{new Date(rec.verifiedAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>Nonce: {rec.nonce}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold">
                    VERIFIED ({rec.latencyMs || 24}ms)
                  </span>
                  <span className="text-slate-400">
                    {rec.verificationMethod === 'BIOMETRIC_QR' ? '128D Face Biometric' : 'Rotating Seed'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-mono font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    CS402 — Network Security & Cryptography
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Verified on Hall B-201 Projector • Nonce: 0x8F3A2B1C90D4
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold font-mono text-[11px]">
                VERIFIED (24ms)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
