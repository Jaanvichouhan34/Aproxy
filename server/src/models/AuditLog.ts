import mongoose, { Document, Schema, Model } from 'mongoose';

export type OverrideStatus = 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';
export type PreviousStatus = 'ABSENT' | 'PRESENT' | 'LATE' | 'EXCUSED' | 'REJECTED';

export interface IAuditLog extends Document {
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  enrollmentNumber: string;
  sessionId: mongoose.Types.ObjectId;
  subjectCode?: string;
  subjectName?: string;
  oldStatus: PreviousStatus;
  newStatus: OverrideStatus;
  reason: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    teacherName: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      required: [true, 'Enrollment number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    subjectCode: {
      type: String,
      trim: true,
    },
    subjectName: {
      type: String,
      trim: true,
    },
    oldStatus: {
      type: String,
      enum: ['ABSENT', 'PRESENT', 'LATE', 'EXCUSED', 'REJECTED'],
      default: 'ABSENT',
      required: true,
    },
    newStatus: {
      type: String,
      enum: ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'],
      required: [true, 'New status is required'],
    },
    reason: {
      type: String,
      required: [true, 'Mandatory override reason is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed query indexing
AuditLogSchema.index({ sessionId: 1, timestamp: -1 });
AuditLogSchema.index({ teacherId: 1, timestamp: -1 });
AuditLogSchema.index({ studentId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
