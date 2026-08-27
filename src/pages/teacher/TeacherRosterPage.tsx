import React, { useState } from 'react';
import { Search, UserCheck, ShieldAlert, Fingerprint, Mail, Award, ArrowUpRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface StudentProfile {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  attendanceRate: number;
  faceDescriptorEnrolled: boolean;
  lastSeen: string;
}

export const TeacherRosterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnrolled, setFilterEnrolled] = useState<'ALL' | 'ENROLLED' | 'PENDING'>('ALL');

  const [students] = useState<StudentProfile[]>([
    {
      id: 'STD-01',
      name: 'Alex Rivera',
      rollNo: '2024-CS-089',
      email: 'alex.rivera@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 98.4,
      faceDescriptorEnrolled: true,
      lastSeen: 'Today at 02:30 PM',
    },
    {
      id: 'STD-02',
      name: 'Elena Rostova',
      rollNo: '2024-CS-042',
      email: 'elena.rostova@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 95.0,
      faceDescriptorEnrolled: true,
      lastSeen: 'Today at 02:30 PM',
    },
    {
      id: 'STD-03',
      name: 'Kavita Sharma',
      rollNo: '2024-CS-112',
      email: 'kavita.sharma@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 92.5,
      faceDescriptorEnrolled: true,
      lastSeen: 'Today at 02:30 PM',
    },
    {
      id: 'STD-04',
      name: 'David Chen',
      rollNo: '2024-CS-015',
      email: 'david.chen@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 96.0,
      faceDescriptorEnrolled: true,
      lastSeen: 'Yesterday at 11:15 AM',
    },
    {
      id: 'STD-05',
      name: 'Priya Patel',
      rollNo: '2024-CS-088',
      email: 'priya.patel@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 88.0,
      faceDescriptorEnrolled: true,
      lastSeen: 'Yesterday at 11:15 AM',
    },
    {
      id: 'STD-06',
      name: 'Liam Vance',
      rollNo: '2024-CS-077',
      email: 'liam.vance@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 64.2, // Below 75% threshold
      faceDescriptorEnrolled: false,
      lastSeen: '4 days ago',
    },
    {
      id: 'STD-07',
      name: 'Marcus Brody',
      rollNo: '2024-CS-031',
      email: 'marcus.brody@university.edu',
      department: 'Computer Science & Eng.',
      attendanceRate: 91.0,
      faceDescriptorEnrolled: true,
      lastSeen: '3 days ago',
    },
  ]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEnrollment =
      filterEnrolled === 'ALL' ||
      (filterEnrolled === 'ENROLLED' && s.faceDescriptorEnrolled) ||
      (filterEnrolled === 'PENDING' && !s.faceDescriptorEnrolled);

    return matchesSearch && matchesEnrollment;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Enrolled Student Directory
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Biometric vector status and cumulative attendance health metrics
          </p>
        </div>

        <Badge variant="brand" className="text-xs">
          {students.length} Total Registered Students
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search students by name, roll number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setFilterEnrolled('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterEnrolled === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterEnrolled('ENROLLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterEnrolled === 'ENROLLED'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Biometrics Enrolled
          </button>
          <button
            onClick={() => setFilterEnrolled('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterEnrolled === 'PENDING'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-brand-500/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {s.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 block">{s.rollNo}</span>
                </div>
              </div>

              {s.faceDescriptorEnrolled ? (
                <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" title="Biometric Vector Ready">
                  <Fingerprint className="w-4 h-4" />
                </span>
              ) : (
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20" title="Face ID Pending">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Attendance Rate</span>
                <span
                  className={`font-mono font-bold ${
                    s.attendanceRate >= 75
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {s.attendanceRate}% {s.attendanceRate < 75 && '(Debarred Warning)'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    s.attendanceRate >= 75
                      ? 'bg-gradient-to-r from-brand-500 to-accent-emerald'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${s.attendanceRate}%` }}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{s.department}</span>
                <span className="font-mono">{s.lastSeen}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
