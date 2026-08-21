import mongoose, { Document, Schema, Model } from 'mongoose';

export type ClassType = 'Lecture' | 'Lab Session' | 'Tutorial' | 'Seminar' | 'Evaluation';

export interface IClassSchedule extends Document {
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:MM" (e.g., "09:00")
  endTime: string; // "HH:MM" (e.g., "10:30")
  roomNumber: string; // e.g. "Hall B-201"
  batch: string; // e.g. "CS-2026-A"
  classType: ClassType;
  createdAt: Date;
  updatedAt: Date;
}

const ClassScheduleSchema = new Schema<IClassSchedule>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: [0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'],
      max: [6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format (24-hour)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format (24-hour)'],
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      maxlength: [50, 'Room number cannot exceed 50 characters'],
      index: true,
    },
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
      default: 'CS-2026-A',
      index: true,
    },
    classType: {
      type: String,
      enum: ['Lecture', 'Lab Session', 'Tutorial', 'Seminar', 'Evaluation'],
      default: 'Lecture',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries and conflict checking
ClassScheduleSchema.index({ teacherId: 1, dayOfWeek: 1 });
ClassScheduleSchema.index({ roomNumber: 1, dayOfWeek: 1 });
ClassScheduleSchema.index({ batch: 1, dayOfWeek: 1 });
ClassScheduleSchema.index({ dayOfWeek: 1, startTime: 1 });

export const ClassSchedule: Model<IClassSchedule> = mongoose.model<IClassSchedule>(
  'ClassSchedule',
  ClassScheduleSchema
);
