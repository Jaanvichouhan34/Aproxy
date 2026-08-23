import mongoose from 'mongoose';
import { ClassSchedule, IClassSchedule } from '../models/ClassSchedule';
import { Subject } from '../models/Subject';

export type ConflictType = 'TEACHER_CONFLICT' | 'ROOM_CONFLICT' | 'BATCH_CONFLICT';

export interface ConflictCheckParams {
  teacherId: string | mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  batch: string;
  excludeScheduleId?: string | mongoose.Types.ObjectId;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: ConflictType;
  message?: string;
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

/**
 * Pure function to check if two time ranges [s1, e1] and [s2, e2] overlap.
 * Adjacent times (e.g. 09:00-10:00 and 10:00-11:00) do NOT overlap.
 */
export const doTimeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  return start1 < end2 && end1 > start2;
};

/**
 * Comprehensive DB conflict detection for creating or updating schedule slots.
 */
export const checkScheduleConflict = async (
  params: ConflictCheckParams
): Promise<ConflictResult> => {
  const {
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    roomNumber,
    batch,
    excludeScheduleId,
  } = params;

  // Base query: same day of week
  const baseQuery: any = {
    dayOfWeek,
  };

  if (excludeScheduleId) {
    baseQuery._id = { $ne: new mongoose.Types.ObjectId(excludeScheduleId.toString()) };
  }

  // Find all schedule slots on this day that could collide (matching teacher, room, or batch)
  const potentialConflicts = await ClassSchedule.find({
    ...baseQuery,
    $or: [
      { teacherId: new mongoose.Types.ObjectId(teacherId.toString()) },
      { roomNumber: roomNumber.trim() },
      { batch: batch.trim() },
    ],
  })
    .populate<{ subjectId: { code: string; name: string } }>('subjectId', 'code name')
    .populate<{ teacherId: { name: string } }>('teacherId', 'name')
    .lean();

  for (const slot of potentialConflicts) {
    if (doTimeRangesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
      const subjectCode = (slot.subjectId as any)?.code || 'Course';
      const subjectName = (slot.subjectId as any)?.name || '';
      const teacherName = (slot.teacherId as any)?.name || 'Faculty Member';

      // 1. Teacher collision
      if (slot.teacherId && (slot.teacherId as any)._id?.toString() === teacherId.toString()) {
        return {
          hasConflict: true,
          conflictType: 'TEACHER_CONFLICT',
          message: `Faculty schedule collision: You are already assigned to teach ${subjectCode} (${slot.startTime} - ${slot.endTime}) in ${slot.roomNumber} on this day.`,
          conflictingSlot: {
            id: slot._id.toString(),
            subjectCode,
            subjectName,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            roomNumber: slot.roomNumber,
            batch: slot.batch,
            teacherName,
          },
        };
      }

      // 2. Room collision
      if (slot.roomNumber.toLowerCase().trim() === roomNumber.toLowerCase().trim()) {
        return {
          hasConflict: true,
          conflictType: 'ROOM_CONFLICT',
          message: `Room collision: ${roomNumber} is already occupied by ${subjectCode} (${slot.startTime} - ${slot.endTime}) taught by ${teacherName}.`,
          conflictingSlot: {
            id: slot._id.toString(),
            subjectCode,
            subjectName,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            roomNumber: slot.roomNumber,
            batch: slot.batch,
            teacherName,
          },
        };
      }

      // 3. Batch collision
      if (slot.batch.toLowerCase().trim() === batch.toLowerCase().trim()) {
        return {
          hasConflict: true,
          conflictType: 'BATCH_CONFLICT',
          message: `Cohort collision: Batch ${batch} already has a scheduled class for ${subjectCode} (${slot.startTime} - ${slot.endTime}).`,
          conflictingSlot: {
            id: slot._id.toString(),
            subjectCode,
            subjectName,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            roomNumber: slot.roomNumber,
            batch: slot.batch,
            teacherName,
          },
        };
      }
    }
  }

  return { hasConflict: false };
};
