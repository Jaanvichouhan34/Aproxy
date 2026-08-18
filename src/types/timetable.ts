export type ClassType = 'Lecture' | 'Lab Session' | 'Tutorial' | 'Seminar' | 'Evaluation';

export interface Subject {
  _id: string;
  code: string;
  name: string;
  department: string;
  teacherId?: string | { _id: string; name: string; email: string; department: string };
  colorTag: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassSchedule {
  _id: string;
  subjectId: Subject;
  teacherId: string | { _id: string; name: string; email: string; department?: string };
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:MM" 24h (e.g., "09:00")
  endTime: string; // "HH:MM" 24h (e.g., "10:30")
  roomNumber: string;
  batch: string;
  classType: ClassType;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubjectPayload {
  code: string;
  name: string;
  department?: string;
  colorTag?: string;
}

export interface CreateSchedulePayload {
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  batch: string;
  classType?: ClassType;
}

export interface UpdateSchedulePayload {
  subjectId?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  roomNumber?: string;
  batch?: string;
  classType?: ClassType;
}

export interface ActiveClassResponse {
  success: boolean;
  hasActiveClass: boolean;
  activeClass: ClassSchedule | null;
  nextClass: ClassSchedule | null;
  timeRemainingMinutes: number;
  startsInMinutes: number;
  currentTime: string;
  currentDay: number;
  totalClassesToday: number;
}

export interface ConflictErrorResponse {
  success: boolean;
  message: string;
  conflictType?: 'TEACHER_CONFLICT' | 'ROOM_CONFLICT' | 'BATCH_CONFLICT';
  conflictingSlot?: {
    id: string;
    subjectCode?: string;
    subjectName?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomNumber: string;
    batch: string;
    teacherName?: string;
  };
}
