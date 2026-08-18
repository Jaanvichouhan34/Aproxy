export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enrollmentNumber?: string | null;
  department: string;
  faceDescriptorEnrolled: boolean;
  faceDescriptor?: number[];
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  user?: User;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  enrollmentNumber?: string;
  department?: string;
  faceDescriptor?: number[];
}

export interface LoginPayload {
  email: string;
  password: string;
}
