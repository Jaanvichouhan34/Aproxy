import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createSubjectSchema = z.object({
  code: z
    .string({ required_error: 'Subject code is required' })
    .min(2, 'Subject code must be at least 2 characters')
    .max(15, 'Subject code cannot exceed 15 characters')
    .trim()
    .toUpperCase(),
  name: z
    .string({ required_error: 'Subject name is required' })
    .min(2, 'Subject name must be at least 2 characters')
    .max(120, 'Subject name cannot exceed 120 characters')
    .trim(),
  department: z.string().trim().optional(),
  colorTag: z.string().trim().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createScheduleSchema = z
  .object({
    subjectId: z
      .string({ required_error: 'Subject ID is required' })
      .min(1, 'Subject ID cannot be empty')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ObjectId format'),
    dayOfWeek: z
      .number({ required_error: 'Day of week is required' })
      .int('Day of week must be an integer')
      .min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
      .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'),
    startTime: z
      .string({ required_error: 'Start time is required' })
      .regex(timeRegex, 'Start time must be in 24-hour HH:MM format (e.g. 09:00)'),
    endTime: z
      .string({ required_error: 'End time is required' })
      .regex(timeRegex, 'End time must be in 24-hour HH:MM format (e.g. 10:30)'),
    roomNumber: z
      .string({ required_error: 'Room number is required' })
      .min(1, 'Room number cannot be empty')
      .max(50, 'Room number cannot exceed 50 characters')
      .trim(),
    batch: z
      .string()
      .min(1, 'Batch identifier cannot be empty')
      .max(50, 'Batch identifier cannot exceed 50 characters')
      .trim()
      .default('CS-2026-A'),
    classType: z
      .enum(['Lecture', 'Lab Session', 'Tutorial', 'Seminar', 'Evaluation'])
      .default('Lecture'),
  })
  .refine(
    (data) => {
      return data.startTime < data.endTime;
    },
    {
      message: 'Start time must be earlier than end time',
      path: ['endTime'],
    }
  );

export const updateScheduleSchema = z
  .object({
    subjectId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Subject ObjectId format')
      .optional(),
    dayOfWeek: z
      .number()
      .int()
      .min(0)
      .max(6)
      .optional(),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format').optional(),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format').optional(),
    roomNumber: z.string().min(1).max(50).trim().optional(),
    batch: z.string().min(1).max(50).trim().optional(),
    classType: z
      .enum(['Lecture', 'Lab Session', 'Tutorial', 'Seminar', 'Evaluation'])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'Start time must be earlier than end time',
      path: ['endTime'],
    }
  );

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
