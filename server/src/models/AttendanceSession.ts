import mongoose, { Document, Schema, Model } from 'mongoose';

export type SessionStatus = 'ACTIVE' | 'ENDED';

export interface IAttendanceSession extends Document {
  teacherId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  subjectCode: string;
  subjectName: string;
  roomNumber: string;
  batch: string;
  scheduleId?: mongoose.Types.ObjectId;
  secretKey: string; // Dynamic secret key used to HMAC-SHA256 sign rotating tokens
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date | null;
  totalAttended: number;
  geofenceRadiusMeters?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
      default: 'CS-2026-A',
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      default: null,
    },
    secretKey: {
      type: String,
      required: [true, 'Session secret key is required'],
      select: false, // Protected from general queries
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ENDED'],
      default: 'ACTIVE',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    totalAttended: {
      type: Number,
      default: 0,
      min: 0,
    },
    geofenceRadiusMeters: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes
AttendanceSessionSchema.index({ teacherId: 1, status: 1 });
AttendanceSessionSchema.index({ subjectId: 1, status: 1 });
AttendanceSessionSchema.index({ status: 1, startedAt: -1 });

export const AttendanceSession: Model<IAttendanceSession> = mongoose.model<IAttendanceSession>(
  'AttendanceSession',
  AttendanceSessionSchema
);
