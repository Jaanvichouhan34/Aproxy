import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISubject extends Document {
  code: string;
  name: string;
  department: string;
  teacherId: mongoose.Types.ObjectId;
  colorTag: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
      maxlength: [15, 'Subject code cannot exceed 15 characters'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [120, 'Subject name cannot exceed 120 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      default: 'Computer Science & Engineering',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    colorTag: {
      type: String,
      trim: true,
      default: '#6366F1', // Default Indigo/Brand color
    },
  },
  {
    timestamps: true,
  }
);

SubjectSchema.index({ code: 1, teacherId: 1 }, { unique: true });
SubjectSchema.index({ department: 1 });

export const Subject: Model<ISubject> = mongoose.model<ISubject>('Subject', SubjectSchema);
