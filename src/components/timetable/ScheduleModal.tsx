import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  Plus,
  Check,
} from 'lucide-react';
import { ClassSchedule, Subject, ClassType } from '../../types/timetable';
import { useTimetableStore } from '../../store/useTimetableStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlot?: ClassSchedule | null;
  defaultDay?: number;
}

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

const ROOM_PRESETS = ['Hall B-201', 'Auditorium 3', 'Security Lab 4', 'Hall A-102', 'Cloud Lab 2', 'Conference Room 1'];
const CLASS_TYPES: ClassType[] = ['Lecture', 'Lab Session', 'Tutorial', 'Seminar', 'Evaluation'];
const COLOR_PRESETS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6'];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  initialSlot,
  defaultDay = 1,
}) => {
  const {
    subjects,
    teacherSchedule,
    createSchedule,
    updateSchedule,
    createSubject,
    isActionLoading,
  } = useTimetableStore();

  // Form State
  const [subjectId, setSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(defaultDay);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [roomNumber, setRoomNumber] = useState('Hall B-201');
  const [batch, setBatch] = useState('CS-2026-A');
  const [classType, setClassType] = useState<ClassType>('Lecture');

  // Inline New Subject Mode
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubDept, setNewSubDept] = useState('Computer Science & Engineering');
  const [newSubColor, setNewSubColor] = useState('#6366F1');

  // Error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSlot) {
      setSubjectId(initialSlot.subjectId?._id || (initialSlot.subjectId as any) || '');
      setDayOfWeek(initialSlot.dayOfWeek);
      setStartTime(initialSlot.startTime);
      setEndTime(initialSlot.endTime);
      setRoomNumber(initialSlot.roomNumber);
      setBatch(initialSlot.batch);
      setClassType(initialSlot.classType || 'Lecture');
    } else {
      if (subjects.length > 0 && !subjectId) {
        setSubjectId(subjects[0]._id);
      }
      setDayOfWeek(defaultDay);
      setStartTime('09:00');
      setEndTime('10:30');
      setRoomNumber('Hall B-201');
      setBatch('CS-2026-A');
      setClassType('Lecture');
    }
    setError(null);
    setIsCreatingSubject(false);
  }, [initialSlot, isOpen, subjects, defaultDay]);

  if (!isOpen) return null;

  // Calculate duration in hours and minutes
  const calculateDuration = () => {
    if (!startTime || !endTime) return '';
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff <= 0) return 'Invalid time (End must be after Start)';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr ${mins} mins`;
  };

  const handleCreateNewSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) {
      toast.error('Please enter course code and subject name');
      return;
    }

    const created = await createSubject({
      code: newSubCode.trim().toUpperCase(),
      name: newSubName.trim(),
      department: newSubDept.trim(),
      colorTag: newSubColor,
    });

    if (created) {
      setSubjectId(created._id);
      setIsCreatingSubject(false);
      setNewSubCode('');
      setNewSubName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subjectId) {
      setError('Please select or create a subject');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be strictly earlier than end time.');
      return;
    }

    // Client-side quick conflict pre-check
    const hasCollision = teacherSchedule.some((s) => {
      if (initialSlot && s._id === initialSlot._id) return false;
      if (s.dayOfWeek !== dayOfWeek) return false;
      // Overlap check
      const overlaps = startTime < s.endTime && endTime > s.startTime;
      if (!overlaps) return false;

      return (
        s.roomNumber.toLowerCase() === roomNumber.toLowerCase() ||
        s.batch.toLowerCase() === batch.toLowerCase()
      );
    });

    if (hasCollision) {
      setError(`Notice: There may be a schedule conflict on ${DAYS.find(d => d.id === dayOfWeek)?.name} for this room or batch.`);
    }

    try {
      if (initialSlot) {
        await updateSchedule(initialSlot._id, {
          subjectId,
          dayOfWeek,
          startTime,
          endTime,
          roomNumber,
          batch,
          classType,
        });
      } else {
        await createSchedule({
          subjectId,
          dayOfWeek,
          startTime,
          endTime,
          roomNumber,
          batch,
          classType,
        });
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save schedule slot';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialSlot ? 'Edit Class Schedule Slot' : 'Add Weekly Class Slot'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure classroom timetable slot with automated conflict detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject Picker or Creator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                Course / Subject
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingSubject(!isCreatingSubject)}
                className="text-xs text-brand-500 hover:text-brand-400 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                {isCreatingSubject ? 'Select Existing Subject' : '+ Create New Subject'}
              </button>
            </div>

            {isCreatingSubject ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  New Course Subject
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS402"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Color Tag</label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewSubColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                            newSubColor === color ? 'scale-110 ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {newSubColor === color && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Network Security & Applied Cryptography"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="glow"
                    size="sm"
                    onClick={handleCreateNewSubject}
                    isLoading={isActionLoading}
                    className="text-xs"
                  >
                    Save Subject
                  </Button>
                </div>
              </div>
            ) : (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {subjects.length === 0 && <option value="">No subjects registered yet</option>}
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.code} — {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Day of Week Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              Day of Week
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayOfWeek(d.id)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    dayOfWeek === d.id
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-500/40'
                  }`}
                >
                  {d.name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Timings: Start and End */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                Time Interval (24h)
              </label>
              <span className="text-[11px] font-mono text-brand-500 font-semibold">
                Duration: {calculateDuration()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Classroom Venue & Room Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
              Classroom Venue / Room
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. Hall B-201"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              required
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Quick Select:</span>
              {ROOM_PRESETS.map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => setRoomNumber(rm)}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {rm}
                </button>
              ))}
            </div>
          </div>

          {/* Batch & Class Type Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent-emerald" />
                Student Batch / Section
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. CS-2026-A"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Instruction Type
              </label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value as ClassType)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              >
                {CLASS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="button"
            variant="glow"
            size="md"
            onClick={handleSubmit}
            isLoading={isActionLoading}
            className="font-semibold text-xs"
          >
            {initialSlot ? 'Update Schedule Slot' : 'Save & Validate Slot'}
          </Button>
        </div>
      </div>
    </div>
  );
};
