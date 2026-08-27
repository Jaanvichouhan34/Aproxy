import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Search,
  User,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAttendanceStore, LiveRosterStudent } from '../../store/useAttendanceStore';
import { toast } from 'sonner';

interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent?: LiveRosterStudent | null;
  sessionId: string;
}

const OVERRIDE_REASONS = [
  'Device Camera Malfunction',
  'Permission Slip / Dean Approval',
  'Biometric False Rejection (Sensor Glitch)',
  'Medical Emergency / Official Duty',
  'Network / Geofence Connectivity Drop',
  'Other Approved Institutional Exception',
];

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  isOpen,
  onClose,
  selectedStudent,
  sessionId,
}) => {
  const { liveRoster, manualOverride } = useAttendanceStore();

  const [studentQuery, setStudentQuery] = useState('');
  const [chosenStudentId, setChosenStudentId] = useState<string>('');
  const [status, setStatus] = useState<'PRESENT' | 'LATE' | 'EXCUSED'>('PRESENT');
  const [reason, setReason] = useState<string>(OVERRIDE_REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      setChosenStudentId(selectedStudent.studentId || selectedStudent.id);
      setStatus(
        selectedStudent.status === 'LATE'
          ? 'LATE'
          : selectedStudent.status === 'EXCUSED'
          ? 'EXCUSED'
          : 'PRESENT'
      );
    } else if (liveRoster.length > 0 && !chosenStudentId) {
      setChosenStudentId(liveRoster[0].studentId || liveRoster[0].id);
    }
  }, [selectedStudent, liveRoster, chosenStudentId]);

  if (!isOpen) return null;

  const currentStudentObj = liveRoster.find(
    (s) => (s.studentId || s.id) === chosenStudentId || s.rollNo === chosenStudentId
  );

  const filteredRoster = liveRoster.filter(
    (s) =>
      s.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenStudentId) {
      toast.error('Please select a student');
      return;
    }
    if (!reason) {
      toast.error('Please select a mandatory override reason');
      return;
    }

    setIsSubmitting(true);
    const res = await manualOverride({
      sessionId,
      studentId: chosenStudentId,
      newStatus: status,
      reason,
      notes,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success(res.message);
      onClose();
    } else {
      toast.error(res.message || 'Failed to apply override');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Faculty Manual Override
                </h3>
                <Badge variant="warning" className="text-[10px]">
                  AUDIT LOGGED
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Overrule biometric or QR check-in status with immutable audit logging
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Override Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Select Student</span>
              {currentStudentObj && (
                <span className="text-[11px] font-mono text-brand-500 font-normal">
                  Current Status: {currentStudentObj.status}
                </span>
              )}
            </label>

            {/* If opening directly on a preselected student */}
            {selectedStudent ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {selectedStudent.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedStudent.rollNo} • {selectedStudent.department}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedStudent.status === 'PRESENT'
                      ? 'emerald'
                      : selectedStudent.status === 'LATE'
                      ? 'warning'
                      : selectedStudent.status === 'EXCUSED'
                      ? 'brand'
                      : 'neutral'
                  }
                  className="text-[10px]"
                >

                  {selectedStudent.status}
                </Badge>
              </div>
            ) : (
              /* Dropdown Search for Roster */
              <div className="space-y-2">
                <select
                  value={chosenStudentId}
                  onChange={(e) => setChosenStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {liveRoster.map((s) => (
                    <option key={s.id || s.studentId} value={s.studentId || s.id}>
                      {s.name} ({s.rollNo}) — [{s.status}]
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* New Status Selection Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Override Attendance Status
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setStatus('PRESENT')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'PRESENT'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Present</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('LATE')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'LATE'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Late</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('EXCUSED')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  status === 'EXCUSED'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Excused</span>
              </button>
            </div>
          </div>

          {/* Mandatory Override Reason Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span>Mandatory Override Reason</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              {OVERRIDE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Faculty Audit Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Student camera lens cracked; verified college ID card in person"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Security Compliance Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Trust Faculty Audit Trail:</strong> This action will be permanently recorded in the institutional audit log with your Faculty ID, IP address, and timestamp.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="glow"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              className="font-bold text-xs"
            >
              Apply Override & Log Audit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualOverrideModal;
