import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Users,
  Play,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ClassSchedule } from '../../types/timetable';
import { useTimetableStore } from '../../store/useTimetableStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface TimetableGridProps {
  schedule: ClassSchedule[];
  isTeacher?: boolean;
  onEditSlot?: (slot: ClassSchedule) => void;
  onAddNewSlot?: (day: number) => void;
}

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  schedule,
  isTeacher = false,
  onEditSlot,
  onAddNewSlot,
}) => {
  const navigate = useNavigate();
  const { isSlotActive, deleteSchedule, isActionLoading } = useTimetableStore();
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday default
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

  const handleLaunchSession = (slot: ClassSchedule) => {
    const code = slot.subjectId?.code || 'CS402';
    const room = slot.roomNumber || 'Hall B-201';
    toast.success(`Launching Cryptographic Live Session for ${code} in ${room}`);
    navigate('/teacher/live-sessions', {
      state: {
        courseCode: code,
        courseName: slot.subjectId?.name,
        roomNumber: room,
        batch: slot.batch,
      },
    });
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteSchedule(id);
    setSlotToDelete(null);
  };

  // Group slots by day
  const slotsByDay = DAYS.reduce((acc, d) => {
    acc[d.id] = schedule
      .filter((s) => s.dayOfWeek === d.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<number, ClassSchedule[]>);

  return (
    <div className="space-y-6">
      {/* View Switcher and Day Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Day Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Weekly Matrix</span>
          </button>

          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDay(d.id);
                setViewMode('cards');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards' && selectedDay === d.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{d.name}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                {slotsByDay[d.id]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Action button if teacher */}
        {isTeacher && (
          <div className="flex items-center gap-2">
            <Button
              variant="glow"
              size="sm"
              onClick={() => onAddNewSlot?.(selectedDay)}
              className="text-xs"
            >
              + Add Class Slot
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. WEEKLY MATRIX GRID VIEW (Mon - Sat, 08:00 - 18:00) */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row: Days */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
                  Time / Day
                </div>
                {DAYS.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex items-center justify-center gap-1.5"
                  >
                    <span>{d.name}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500/10 text-brand-500 font-mono">
                      {slotsByDay[d.id]?.length || 0}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns Body */}
              <div className="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
                {/* Time Indicator Column */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30">
                  {TIME_SLOTS.map((t) => (
                    <div
                      key={t}
                      className="h-24 p-2 text-right text-[11px] font-mono text-slate-400 font-medium flex items-start justify-end"
                    >
                      {t}
                    </div>
                  ))}
                </div>

                {/* 6 Day Columns */}
                {DAYS.map((d) => {
                  const daySlots = slotsByDay[d.id] || [];

                  return (
                    <div
                      key={d.id}
                      className="p-2 space-y-2.5 bg-transparent min-h-[600px] relative"
                    >
                      {daySlots.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                          <span className="text-[11px] font-mono text-slate-400">No classes</span>
                          {isTeacher && (
                            <button
                              onClick={() => onAddNewSlot?.(d.id)}
                              className="mt-2 text-[10px] text-brand-500 hover:underline cursor-pointer"
                            >
                              + Add Slot
                            </button>
                          )}
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const active = isSlotActive(slot);
                          const color = slot.subjectId?.colorTag || '#6366F1';

                          return (
                            <div
                              key={slot._id}
                              style={{
                                borderLeftColor: color,
                                borderLeftWidth: '4px',
                              }}
                              className={`p-3 rounded-2xl transition-all relative group text-xs ${
                                active
                                  ? 'bg-rose-500/10 dark:bg-rose-950/20 border-2 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/20'
                                  : 'bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:shadow-md'
                              }`}
                            >
                              {/* Glowing Radar & Ongoing Badge */}
                              {active && (
                                <div className="mb-2 flex items-center justify-between">
                                  <Badge variant="rose" dot pulse className="text-[9px] font-bold">
                                    ONGOING NOW
                                  </Badge>
                                </div>
                              )}

                              {/* Course Code & Type */}
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span
                                  className="font-mono font-extrabold text-xs px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${color}15`,
                                    color: color,
                                  }}
                                >
                                  {slot.subjectId?.code || 'COURSE'}
                                </span>
                                <span className="text-[10px] text-slate-400">{slot.classType}</span>
                              </div>

                              {/* Title */}
                              <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-2">
                                {slot.subjectId?.name || 'Class Session'}
                              </h4>

                              {/* Meta Details */}
                              <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-brand-500 shrink-0" />
                                  <span>
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-accent-cyan shrink-0" />
                                  <span className="truncate">{slot.roomNumber}</span>
                                </div>
                              </div>

                              {/* Interactive Actions Overlay */}
                              {isTeacher && (
                                <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-1">
                                  <button
                                    onClick={() => handleLaunchSession(slot)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      active
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                                        : 'bg-brand-600/10 text-brand-600 hover:bg-brand-600 hover:text-white'
                                    }`}
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>{active ? 'Live Projector' : 'Launch'}</span>
                                  </button>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => onEditSlot?.(slot)}
                                      className="p-1 rounded-md text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
                                      title="Edit slot"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setSlotToDelete(slot._id)}
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="Delete slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SINGLE DAY LIST / CARDS VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              <span>{DAYS.find((d) => d.id === selectedDay)?.name} Class Schedule</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {slotsByDay[selectedDay]?.length || 0} Scheduled Classes
            </span>
          </div>

          {slotsByDay[selectedDay]?.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No classes scheduled on this day
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are currently no active classroom slots booked for this weekday.
              </p>
              {isTeacher && (
                <Button
                  variant="glow"
                  size="sm"
                  onClick={() => onAddNewSlot?.(selectedDay)}
                  className="text-xs"
                >
                  + Add First Slot
                </Button>
              )}
            </div>
          ) : (
            slotsByDay[selectedDay].map((slot) => {
              const active = isSlotActive(slot);
              const color = slot.subjectId?.colorTag || '#6366F1';
              const teacherName =
                typeof slot.teacherId === 'object' && slot.teacherId?.name
                  ? slot.teacherId.name
                  : 'Faculty Member';

              return (
                <div
                  key={slot._id}
                  style={{
                    borderLeftColor: color,
                    borderLeftWidth: '6px',
                  }}
                  className={`p-6 rounded-3xl bg-white dark:bg-surface-dark transition-all ${
                    active
                      ? 'border-2 border-rose-500 shadow-xl shadow-rose-500/10 dark:bg-gradient-to-r dark:from-surface-dark dark:to-rose-950/20 ring-2 ring-rose-500/20'
                      : 'border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                          }}
                        >
                          {slot.subjectId?.code || 'COURSE'}
                        </span>
                        <Badge variant="brand" className="text-[10px]">
                          {slot.classType}
                        </Badge>
                        <Badge variant="cyan" className="text-[10px]">
                          {slot.batch}
                        </Badge>
                        {active && (
                          <Badge variant="rose" dot pulse className="text-[10px] font-bold">
                            ONGOING LIVE CLASS
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {slot.subjectId?.name || 'Classroom Session'}
                      </h3>

                      {!isTeacher && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Instructor: <span className="font-semibold">{teacherName}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-brand-500" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-accent-cyan" />
                          <span>{slot.roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-accent-emerald" />
                          <span>Batch: {slot.batch}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isTeacher ? (
                        <>
                          <Button
                            variant={active ? 'glow' : 'outline'}
                            size="md"
                            onClick={() => handleLaunchSession(slot)}
                            className="font-semibold text-xs"
                            rightIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                          >
                            {active ? 'Control Live Session' : 'Start Session'}
                          </Button>

                          <button
                            onClick={() => onEditSlot?.(slot)}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSlotToDelete(slot._id)}
                            className="p-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        active && (
                          <Button
                            variant="glow"
                            size="md"
                            onClick={() => navigate('/student/scan')}
                            className="text-xs font-bold"
                          >
                            Quick Scan QR
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {slotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Schedule Slot?
            </h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to remove this timetable slot? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSlotToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => handleDeleteConfirm(slotToDelete)}
                isLoading={isActionLoading}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white"
              >
                Delete Slot
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
