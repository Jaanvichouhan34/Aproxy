import mongoose, { Document, Schema, Model } from 'mongoose';

export type UserRole = 'teacher' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  enrollmentNumber?: string;
  department: string;
  faceDescriptor: number[];
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['teacher', 'student'],
      required: [true, 'Role is required'],
      index: true,
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      default: 'Computer Science & Engineering',
      trim: true,
    },
    faceDescriptor: {
      type: [Number],
      default: [],
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes
UserSchema.index({ role: 1, department: 1 });

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
