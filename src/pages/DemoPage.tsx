import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LiveSimulatorWidget } from '../components/LiveSimulatorWidget';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Layers,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AttendanceRow {
  id: string;
  name: string;
  rollNo: string;
  timestamp: string;
  latencyMs: number;
  status: 'PRESENT' | 'REJECTED';
  reason?: string;
  signature: string;
}

export const DemoPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('CS402');
  const [searchQuery, setSearchQuery] = useState('');

  const [roster, setRoster] = useState<AttendanceRow[]>([
    {
      id: 'REC-901',
      name: 'Alex Rivera',
      rollNo: '2024-CS-089',
      timestamp: '02:30:12',
      latencyMs: 24,
      status: 'PRESENT',
      signature: '0x8F3A2B1C',
    },
    {
      id: 'REC-902',
      name: 'Elena Rostova',
      rollNo: '2024-CS-042',
      timestamp: '02:30:13',
      latencyMs: 19,
      status: 'PRESENT',
      signature: '0x1C99A4DF',
    },
    {
      id: 'REC-903',
      name: 'Kavita Sharma',
      rollNo: '2024-CS-112',
      timestamp: '02:30:15',
      latencyMs: 31,
      status: 'PRESENT',
      signature: '0x7B01EE45',
    },
    {
      id: 'REC-904',
      name: 'Liam Vance (Proxy Attempt)',
      rollNo: '2024-CS-077',
      timestamp: '02:30:17',
      latencyMs: 44,
      status: 'REJECTED',
      reason: 'Token Expired (Screenshot Replay >1000ms)',
      signature: '0x00000000',
    },
    {
      id: 'REC-905',
      name: 'David Chen',
      rollNo: '2024-CS-015',
      timestamp: '02:30:19',
      latencyMs: 22,
      status: 'PRESENT',
      signature: '0x4E9281BC',
    },
  ]);

  const filteredRoster = roster.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Name,RollNo,Timestamp,LatencyMs,Status,CryptographicSignature\n' +
      roster
        .map(
          (r) =>
            `${r.id},"${r.name}",${r.rollNo},${r.timestamp},${r.latencyMs}ms,${r.status},${r.signature}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aproxy_attendance_${selectedCourse}_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col justify-between">
      <Navbar />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        {/* Sandbox Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" dot pulse>
                INTERACTIVE LAB
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                Environment: Standalone Sandbox
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Aproxy Live Protocol Sandbox
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Experience the dual-sided teacher and student flow in real-time. Test attack vectors, inspect live HMAC tokens, and examine the tamper-evident ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Signed CSV
            </Button>
          </div>
        </div>

        {/* Live Simulator Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-500" />
              Real-Time Dynamic QR & Scanner Engine
            </h2>
            <span className="text-xs text-slate-500 font-mono">1.0s High-Precision Cycle</span>
          </div>

          <LiveSimulatorWidget />
        </div>

        {/* Live Attendance Ledger Table */}
        <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Tamper-Evident Attendance Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cryptographically signed transactions committed via sub-50ms atomic consensus
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Verification Latency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">HMAC Proof Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRoster.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-slate-400">{row.id}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {row.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-brand-600 dark:text-brand-300">
                      {row.rollNo}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{row.timestamp}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {row.latencyMs}ms
                    </td>
                    <td className="px-4 py-3.5">
                      {row.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> BLOCKED ({row.reason})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                      <code>{row.signature}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
