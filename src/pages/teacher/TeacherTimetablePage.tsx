import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Sparkles,
  RefreshCw,
  Layers,
  BookOpen,
  Database,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TimetableGrid } from '../../components/timetable/TimetableGrid';
import { ScheduleModal } from '../../components/timetable/ScheduleModal';
import { TimeSimulatorBar } from '../../components/timetable/TimeSimulatorBar';
import { useTimetableStore } from '../../store/useTimetableStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ClassSchedule } from '../../types/timetable';

export const TeacherTimetablePage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    teacherSchedule,
    subjects,
    isLoading,
    isActionLoading,
    fetchTeacherSchedule,
    fetchSubjects,
    fetchActiveClass,
    seedSampleTimetable,
  } = useTimetableStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ClassSchedule | null>(null);
  const [selectedDayForNew, setSelectedDayForNew] = useState(1);

  useEffect(() => {
    fetchSubjects();
    fetchTeacherSchedule();
    fetchActiveClass();

    // Polling active class every 15 seconds to keep live clock indicator updated
    const timer = setInterval(() => {
      fetchActiveClass();
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const handleOpenAddModal = (day: number = 1) => {
    setEditingSlot(null);
    setSelectedDayForNew(day);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot: ClassSchedule) => {
    setEditingSlot(slot);
    setSelectedDayForNew(slot.dayOfWeek);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Academic Schedule & Timetable Engine
            </h2>
            <Badge variant="brand" className="text-xs font-mono">
              Fall 2026
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {user?.department || 'Department of Computer Science & Engineering'} • Dynamic Session Controls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teacherSchedule.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={seedSampleTimetable}
              isLoading={isActionLoading}
              className="text-xs"
              leftIcon={<Database className="w-3.5 h-3.5" />}
            >
              Seed Standard Schedule
            </Button>
          )}

          <Button
            variant="glow"
            size="md"
            onClick={() => handleOpenAddModal(1)}
            className="text-xs font-semibold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Class Slot
          </Button>
        </div>
      </div>

      {/* Real-time Clock & Simulation Testing Bar */}
      <TimeSimulatorBar />

      {/* Timetable Matrix / Day Cards Grid */}
      {isLoading ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Loading Academic Timetable...
          </span>
          <span className="text-xs text-slate-400">
            Syncing schedule mesh with conflict validation engine
          </span>
        </div>
      ) : teacherSchedule.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Scheduled Classes Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven't added any timetable slots yet. Click below to generate the standard semester schedule or create custom classroom slots.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="glow"
              size="md"
              onClick={seedSampleTimetable}
              isLoading={isActionLoading}
              className="text-xs font-bold"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Populate Standard Curriculum
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => handleOpenAddModal(1)}
              className="text-xs font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create First Slot
            </Button>
          </div>
        </div>
      ) : (
        <TimetableGrid
          schedule={teacherSchedule}
          isTeacher={true}
          onAddNewSlot={handleOpenAddModal}
          onEditSlot={handleOpenEditModal}
        />
      )}

      {/* Add / Edit Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSlot={editingSlot}
        defaultDay={selectedDayForNew}
      />
    </div>
  );
};
