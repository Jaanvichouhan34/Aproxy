import mongoose, { Document, Schema, Model } from 'mongoose';

export type VerificationMethod = 'DYNAMIC_QR' | 'BIOMETRIC_QR' | 'MANUAL_OVERRIDE';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';

export interface IAttendanceRecord extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  enrollmentNumber: string;
  department: string;
  subjectId: mongoose.Types.ObjectId;
  verifiedAt: Date;
  verificationMethod: VerificationMethod;
  status: AttendanceStatus;
  nonce: string;
  latencyMs: number;
  biometricMatched?: boolean;
  similarityScore?: number;
  ipAddress?: string;
  userAgent?: string;
  isManualOverride?: boolean;
  overrideReason?: string;
  overriddenBy?: mongoose.Types.ObjectId;
  overriddenAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session ID is required'],
      index: true,
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
    department: {
      type: String,
      required: true,
      default: 'Computer Science & Engineering',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: ['DYNAMIC_QR', 'BIOMETRIC_QR', 'MANUAL_OVERRIDE'],
      default: 'DYNAMIC_QR',
    },
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'],
      default: 'PRESENT',
      index: true,
    },
    nonce: {
      type: String,
      required: [true, 'Validation nonce is required'],
      trim: true,
      default: '0xMANUAL_OVERRIDE',
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    biometricMatched: {
      type: Boolean,
      default: false,
    },
    similarityScore: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    isManualOverride: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
      type: String,
      default: null,
    },
    overriddenBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    overriddenAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Strict compound unique index: A student can only have ONE attendance record per session
AttendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

// Fast lookup indexes
AttendanceRecordSchema.index({ studentId: 1, verifiedAt: -1 });
AttendanceRecordSchema.index({ subjectId: 1, verifiedAt: -1 });
AttendanceRecordSchema.index({ sessionId: 1, verifiedAt: -1 });

export const AttendanceRecord: Model<IAttendanceRecord> = mongoose.model<IAttendanceRecord>(
  'AttendanceRecord',
  AttendanceRecordSchema
);
export default AttendanceRecord;
