import { create } from 'zustand';
import api from '../lib/api';
import {
  Subject,
  ClassSchedule,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  CreateSubjectPayload,
  ActiveClassResponse,
} from '../types/timetable';
import { toast } from 'sonner';

interface TimetableState {
  teacherSchedule: ClassSchedule[];
  studentSchedule: ClassSchedule[];
  subjects: Subject[];
  activeClass: ClassSchedule | null;
  nextClass: ClassSchedule | null;
  hasActiveClass: boolean;
  timeRemainingMinutes: number;
  startsInMinutes: number;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;

  // Real-time / Simulated Clock state
  isSimulationMode: boolean;
  simulatedDay: number | null; // 0-6
  simulatedTime: string | null; // "HH:MM"

  // Actions
  fetchTeacherSchedule: () => Promise<void>;
  fetchStudentSchedule: () => Promise<void>;
  fetchSubjects: () => Promise<void>;
  createSubject: (payload: CreateSubjectPayload) => Promise<Subject | null>;
  createSchedule: (payload: CreateSchedulePayload) => Promise<ClassSchedule | null>;
  updateSchedule: (id: string, payload: UpdateSchedulePayload) => Promise<ClassSchedule | null>;
  deleteSchedule: (id: string) => Promise<boolean>;
  seedSampleTimetable: () => Promise<void>;
  fetchActiveClass: () => Promise<void>;

  // Simulation controls
  enableSimulation: (day: number, time: string) => void;
  disableSimulation: () => void;
  isSlotActive: (slot: ClassSchedule) => boolean;
}

const getCurrentHHMM = (): string => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const useTimetableStore = create<TimetableState>((set, get) => ({
  teacherSchedule: [],
  studentSchedule: [],
  subjects: [],
  activeClass: null,
  nextClass: null,
  hasActiveClass: false,
  timeRemainingMinutes: 0,
  startsInMinutes: 0,
  isLoading: false,
  isActionLoading: false,
  error: null,

  isSimulationMode: false,
  simulatedDay: null,
  simulatedTime: null,

  isSlotActive: (slot: ClassSchedule) => {
    const { isSimulationMode, simulatedDay, simulatedTime } = get();
    const now = new Date();
    const currentDay = isSimulationMode && simulatedDay !== null ? simulatedDay : now.getDay();
    const currentTime = isSimulationMode && simulatedTime ? simulatedTime : getCurrentHHMM();

    return slot.dayOfWeek === currentDay && slot.startTime <= currentTime && slot.endTime > currentTime;
  },

  enableSimulation: (day: number, time: string) => {
    set({ isSimulationMode: true, simulatedDay: day, simulatedTime: time });
    get().fetchActiveClass();
  },

  disableSimulation: () => {
    set({ isSimulationMode: false, simulatedDay: null, simulatedTime: null });
    get().fetchActiveClass();
  },

  fetchSubjects: async () => {
    try {
      const response = await api.get<{ success: boolean; subjects: Subject[] }>('/timetable/subjects');
      if (response.data.success) {
        set({ subjects: response.data.subjects });
      }
    } catch (err: any) {
      console.warn('Failed to fetch subjects:', err?.response?.data?.message || err?.message);
    }
  },

  createSubject: async (payload: CreateSubjectPayload) => {
    set({ isActionLoading: true });
    try {
      const response = await api.post<{ success: boolean; subject: Subject; message: string }>(
        '/timetable/subjects',
        payload
      );
      if (response.data.success) {
        set((state) => ({ subjects: [...state.subjects, response.data.subject] }));
        toast.success(`Subject ${response.data.subject.code} created`);
        return response.data.subject;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create subject';
      toast.error(msg);
      return null;
    } finally {
      set({ isActionLoading: false });
    }
  },

  fetchTeacherSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ success: boolean; schedule: ClassSchedule[] }>('/timetable/teacher');
      if (response.data.success) {
        set({ teacherSchedule: response.data.schedule });
        get().fetchActiveClass();
      }
    } catch (err: any) {
      console.warn('Teacher schedule fetch fallback:', err?.response?.data?.message || err?.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStudentSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ success: boolean; schedule: ClassSchedule[] }>('/timetable/student');
      if (response.data.success) {
        set({ studentSchedule: response.data.schedule });
        get().fetchActiveClass();
      }
    } catch (err: any) {
      console.warn('Student schedule fetch fallback:', err?.response?.data?.message || err?.message);
    } finally {
      set({ isLoading: false });
    }
  },

  createSchedule: async (payload: CreateSchedulePayload) => {
    set({ isActionLoading: true });
    try {
      const response = await api.post<{
        success: boolean;
        slot: ClassSchedule;
        message: string;
      }>('/timetable', payload);

      if (response.data.success) {
        set((state) => ({
          teacherSchedule: [...state.teacherSchedule, response.data.slot],
        }));
        toast.success(response.data.message || 'Class slot scheduled successfully');
        get().fetchActiveClass();
        return response.data.slot;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create schedule slot';
      toast.error(msg);
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  updateSchedule: async (id: string, payload: UpdateSchedulePayload) => {
    set({ isActionLoading: true });
    try {
      const response = await api.put<{
        success: boolean;
        slot: ClassSchedule;
        message: string;
      }>(`/timetable/${id}`, payload);

      if (response.data.success) {
        set((state) => ({
          teacherSchedule: state.teacherSchedule.map((s) => (s._id === id ? response.data.slot : s)),
        }));
        toast.success(response.data.message || 'Schedule updated');
        get().fetchActiveClass();
        return response.data.slot;
      }
      return null;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update schedule slot';
      toast.error(msg);
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteSchedule: async (id: string) => {
    set({ isActionLoading: true });
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/timetable/${id}`);
      if (response.data.success) {
        set((state) => ({
          teacherSchedule: state.teacherSchedule.filter((s) => s._id !== id),
        }));
        toast.success(response.data.message || 'Schedule slot deleted');
        get().fetchActiveClass();
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete schedule slot';
      toast.error(msg);
      return false;
    } finally {
      set({ isActionLoading: false });
    }
  },

  seedSampleTimetable: async () => {
    set({ isActionLoading: true });
    try {
      const res = await api.post<{ success: boolean; message: string }>('/timetable/seed-sample');
      if (res.data.success) {
        toast.success(res.data.message || 'Standard timetable populated');
        await get().fetchTeacherSchedule();
        await get().fetchSubjects();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to seed timetable');
    } finally {
      set({ isActionLoading: false });
    }
  },

  fetchActiveClass: async () => {
    try {
      const { isSimulationMode, simulatedDay, simulatedTime } = get();
      let queryParams = '';
      if (isSimulationMode && simulatedDay !== null && simulatedTime) {
        queryParams = `?clientDay=${simulatedDay}&clientTime=${encodeURIComponent(simulatedTime)}`;
      }

      const response = await api.get<ActiveClassResponse>(`/timetable/active-class${queryParams}`);
      if (response.data.success) {
        set({
          hasActiveClass: response.data.hasActiveClass,
          activeClass: response.data.activeClass,
          nextClass: response.data.nextClass,
          timeRemainingMinutes: response.data.timeRemainingMinutes,
          startsInMinutes: response.data.startsInMinutes,
        });
      }
    } catch (err: any) {
      console.warn('Active class evaluation fallback:', err?.message);
    }
  },
}));
