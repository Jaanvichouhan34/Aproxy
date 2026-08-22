import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid institutional email format').toLowerCase().trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long'),
    role: z.enum(['teacher', 'student'], {
      errorMap: () => ({ message: "Role must be either 'teacher' or 'student'" }),
    }),
    enrollmentNumber: z.string().trim().optional(),
    department: z.string().min(2).default('Computer Science & Engineering'),
    faceDescriptor: z.array(z.number()).optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'student' && (!data.enrollmentNumber || data.enrollmentNumber.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Enrollment Number is required for students',
      path: ['enrollmentNumber'],
    }
  );

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const faceDescriptorSchema = z.object({
  faceDescriptor: z.array(z.number()).length(128, 'Face descriptor vector must contain exactly 128 elements'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FaceDescriptorInput = z.infer<typeof faceDescriptorSchema>;
