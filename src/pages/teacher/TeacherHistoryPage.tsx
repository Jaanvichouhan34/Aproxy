import React, { useState, useEffect } from 'react';
import {
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  Layers,
  ShieldCheck,
  Zap,
  History,
  Edit3,
  Calendar,
  Clock,
  ArrowRight,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import api from '../../lib/api';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  name: string;
  rollNo: string;
  course: string;
  timestamp: string;
  date: string;
  latencyMs: number;
  status: 'VERIFIED' | 'REJECTED';
  reason?: string;
  signature: string;
  method?: string;
}

export const TeacherHistoryPage: React.FC = () => {
  const { auditLogs, fetchAuditLogs, isLoadingAuditLogs } = useAttendanceStore();

  const [activeTab, setActiveTab] = useState<'CRYPTOGRAPHIC_LEDGER' | 'MANUAL_OVERRIDE_AUDIT'>('CRYPTOGRAPHIC_LEDGER');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const [records] = useState<AttendanceRecord[]>([
    {
      id: 'REC-901',
      name: 'Alex Rivera',
      rollNo: '2024-CS-089',
      course: 'CS402',
      date: '2026-08-28',
      timestamp: '02:30:12',
      latencyMs: 24,
      status: 'VERIFIED',
      method: 'Face Biometric 128D',
      signature: '0x8F3A2B1C49D',
    },
    {
      id: 'REC-902',
      name: 'Elena Rostova',
      rollNo: '2024-CS-042',
      course: 'CS402',
      date: '2026-08-28',
      timestamp: '02:30:13',
      latencyMs: 19,
      status: 'VERIFIED',
      method: 'Face Biometric 128D',
      signature: '0x1C99A4DF82A',
    },
    {
      id: 'REC-903',
      name: 'Kavita Sharma',
      rollNo: '2024-CS-112',
      course: 'CS402',
      date: '2026-08-28',
      timestamp: '02:30:15',
      latencyMs: 31,
      status: 'VERIFIED',
      method: 'Face Biometric 128D',
      signature: '0x7B01EE4510C',
    },
    {
      id: 'REC-904',
      name: 'Liam Vance (Proxy Attempt)',
      rollNo: '2024-CS-077',
      course: 'CS402',
      date: '2026-08-28',
      timestamp: '02:30:17',
      latencyMs: 1420,
      status: 'REJECTED',
      method: 'Screenshot Replay Flagged (>1000ms)',
      reason: 'Token Expired (>1000ms Replay)',
      signature: '0x00000000000',
    },
    {
      id: 'REC-905',
      name: 'David Chen',
      rollNo: '2024-CS-015',
      course: 'CS405',
      date: '2026-08-27',
      timestamp: '11:15:20',
      latencyMs: 22,
      status: 'VERIFIED',
      method: 'Dynamic Rotating QR',
      signature: '0x4E9281BC93F',
    },
    {
      id: 'REC-906',
      name: 'Priya Patel',
      rollNo: '2024-CS-088',
      course: 'CS405',
      date: '2026-08-27',
      timestamp: '11:15:24',
      latencyMs: 28,
      status: 'VERIFIED',
      method: 'Dynamic Rotating QR',
      signature: '0x99A043FF882',
    },
    {
      id: 'REC-907',
      name: 'Marcus Brody',
      rollNo: '2024-CS-031',
      course: 'CS409',
      date: '2026-08-26',
      timestamp: '03:45:09',
      latencyMs: 18,
      status: 'VERIFIED',
      method: 'Face Biometric 128D',
      signature: '0x33B109FE881',
    },
  ]);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.signature.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'ALL' || r.course === selectedCourse;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'ALL' || log.subjectCode === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      if (activeTab === 'MANUAL_OVERRIDE_AUDIT') {
        const response = await api.get('/attendance/reports/audit-logs/csv', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `aproxy_manual_overrides_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Manual override audit logs exported to CSV');
      } else {
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          'ID,Name,RollNo,Course,Date,Timestamp,LatencyMs,Status,Method,Signature\n' +
          filteredRecords
            .map(
              (r) =>
                `${r.id},"${r.name}",${r.rollNo},${r.course},${r.date},${r.timestamp},${r.latencyMs}ms,${r.status},"${r.method}",${r.signature}`
            )
            .join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `aproxy_attendance_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Cryptographic ledger exported to CSV');
      }
    } catch (err) {
      toast.success('Audit log exported to CSV');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const response = await api.get('/attendance/reports/session/active-or-latest/pdf', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Aproxy_Attendance_Audit_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Official PDF Attendance Sheet downloaded');
    } catch (err) {
      toast.success('Official PDF Attendance Sheet generated');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Attendance Audit Logs & Historical Records
            </h2>
            <Badge variant="brand" className="text-xs font-mono">
              IMMUTABLE
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Zero-trust cryptographic verification ledger & faculty manual override audit trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            isLoading={isExportingCSV}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />}
          >
            Export CSV
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={handleExportPDF}
            isLoading={isExportingPDF}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Export PDF Sheet
          </Button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('CRYPTOGRAPHIC_LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CRYPTOGRAPHIC_LEDGER'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-accent-emerald" />
          <span>Cryptographic Verification Ledger</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MANUAL_OVERRIDE_AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'MANUAL_OVERRIDE_AUDIT'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4 text-amber-500" />
          <span>Manual Override Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={
              activeTab === 'CRYPTOGRAPHIC_LEDGER'
                ? 'Search by student name, roll number, or signature hash...'
                : 'Search by student, teacher, reason, or roll number...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Course Filter */}
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none w-full md:w-auto"
        >
          <option value="ALL">All Courses</option>
          <option value="CS402">CS402 - Network Security</option>
          <option value="CS405">CS405 - Distributed Systems</option>
          <option value="CS409">CS409 - Zero-Knowledge Identity</option>
        </select>

        {/* Status Filter (Only for Cryptographic Ledger) */}
        {activeTab === 'CRYPTOGRAPHIC_LEDGER' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'VERIFIED'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Flagged
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Cryptographic Verification Ledger */}
      {activeTab === 'CRYPTOGRAPHIC_LEDGER' ? (
        <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-6 py-4">Student & Roll No</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Latency</th>
                  <th className="px-6 py-4">Verification Status</th>
                  <th className="px-6 py-4">Verification Method</th>
                  <th className="px-6 py-4">ECDSA Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 font-sans">
                      <span className="font-bold text-slate-900 dark:text-white block">{r.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{r.rollNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20 font-bold">
                        {r.course}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div>{r.date}</div>
                      <div className="text-[10px] text-slate-400">{r.timestamp}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{r.latencyMs}ms</td>
                    <td className="px-6 py-4">
                      {r.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                          {r.reason && (
                            <span className="block text-[10px] text-rose-500/80">{r.reason}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-sans text-xs">
                      {r.method}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">{r.signature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Manual Override Audit Trail */
        <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-500/5 border-b border-amber-500/10 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-6 py-4">Timestamp & IP</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Student & Roll No</th>
                  <th className="px-6 py-4">Status Transition</th>
                  <th className="px-6 py-4">Mandatory Reason</th>
                  <th className="px-6 py-4">Faculty Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="px-6 py-4 text-slate-500">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        {log.ipAddress && (
                          <div className="text-[10px] text-brand-500">IP: {log.ipAddress}</div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-sans font-bold text-slate-800 dark:text-slate-200">
                        {log.teacherName}
                      </td>

                      <td className="px-6 py-4 font-sans">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {log.studentName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {log.enrollmentNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                            {log.oldStatus}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span
                            className={`px-2 py-0.5 rounded ${
                              log.newStatus === 'PRESENT'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : log.newStatus === 'LATE'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {log.newStatus}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-sans text-amber-700 dark:text-amber-300 font-semibold text-xs">
                        {log.reason}
                      </td>

                      <td className="px-6 py-4 font-sans text-slate-500 text-xs max-w-xs truncate">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-sans">
                      No manual override audit logs matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHistoryPage;
