import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

interface MemoryUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'teacher' | 'student';
  enrollmentNumber?: string | null;
  department?: string;
  faceDescriptor: number[];
  refreshToken?: string | null;
  createdAt: Date;
}

// In-Memory fallback store for instant local development when MongoDB is offline
const memoryUsers = new Map<string, MemoryUser>();

const isMongoConnected = () => mongoose.connection.readyState === 1;

// Initialize demo users
(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Password@123', salt);

  const studentUser: MemoryUser = {
    _id: 'std_660000000000000000000001',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    passwordHash: hash,
    role: 'student',
    enrollmentNumber: '2024-CS-089',
    department: 'Computer Science & Engineering',
    faceDescriptor: [],
    refreshToken: null,
    createdAt: new Date(),
  };

  const teacherUser: MemoryUser = {
    _id: 'tch_660000000000000000000002',
    name: 'Prof. Marcus Thorne',
    email: 'prof.thorne@university.edu',
    passwordHash: hash,
    role: 'teacher',
    enrollmentNumber: null,
    department: 'Cybersecurity & Cryptography',
    faceDescriptor: [],
    refreshToken: null,
    createdAt: new Date(),
  };

  memoryUsers.set(studentUser.email.toLowerCase(), studentUser);
  memoryUsers.set(teacherUser.email.toLowerCase(), teacherUser);
})();

const formatUserResponse = (user: IUser | MemoryUser) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    enrollmentNumber: user.enrollmentNumber || null,
    department: user.department,
    faceDescriptorEnrolled: Array.isArray(user.faceDescriptor) && user.faceDescriptor.length > 0,
    faceDescriptor: user.faceDescriptor || [],
    createdAt: user.createdAt,
  };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, enrollmentNumber, department, faceDescriptor } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const cleanEnrollment = enrollmentNumber ? enrollmentNumber.trim().toUpperCase() : undefined;

    if (isMongoConnected()) {
      try {
        // Check if email already exists
        const existingEmail = await User.findOne({ email: cleanEmail });
        if (existingEmail) {
          res.status(409).json({
            success: false,
            message: 'An account with this institutional email already exists',
            code: 'EMAIL_EXISTS',
          });
          return;
        }

        // If student, check if enrollment number already exists
        if (role === 'student' && cleanEnrollment) {
          const existingEnrollment = await User.findOne({
            enrollmentNumber: cleanEnrollment,
          });
          if (existingEnrollment) {
            res.status(409).json({
              success: false,
              message: 'An account with this enrollment number already exists',
              code: 'ENROLLMENT_EXISTS',
            });
            return;
          }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role,
          enrollmentNumber: role === 'student' ? cleanEnrollment : undefined,
          department: department?.trim() || 'Computer Science & Engineering',
          faceDescriptor: Array.isArray(faceDescriptor) ? faceDescriptor : [],
        });

        const savedUser = await newUser.save();

        const accessToken = generateAccessToken({
          userId: savedUser._id.toString(),
          email: savedUser.email,
          role: savedUser.role,
          name: savedUser.name,
        });

        const refreshToken = generateRefreshToken({
          userId: savedUser._id.toString(),
        });

        savedUser.refreshToken = refreshToken;
        await savedUser.save();

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        res.status(201).json({
          success: true,
          message: 'Account registered successfully',
          accessToken,
          user: formatUserResponse(savedUser),
        });
        return;
      } catch (dbErr) {
        console.warn('[Register DB Error - switching to memory fallback]', dbErr);
      }
    }

    // In-memory fallback
    if (memoryUsers.has(cleanEmail)) {
      res.status(409).json({
        success: false,
        message: 'An account with this institutional email already exists',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const memUserId = 'mem_usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const memUser: MemoryUser = {
      _id: memUserId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      enrollmentNumber: role === 'student' ? cleanEnrollment : null,
      department: department?.trim() || 'Computer Science & Engineering',
      faceDescriptor: Array.isArray(faceDescriptor) ? faceDescriptor : [],
      refreshToken: null,
      createdAt: new Date(),
    };

    const accessToken = generateAccessToken({
      userId: memUser._id,
      email: memUser.email,
      role: memUser.role,
      name: memUser.name,
    });

    const refreshToken = generateRefreshToken({
      userId: memUser._id,
    });

    memUser.refreshToken = refreshToken;
    memoryUsers.set(cleanEmail, memUser);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      accessToken,
      user: formatUserResponse(memUser),
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
      error: error?.message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      try {
        const user = await User.findOne({ email: cleanEmail }).select(
          '+passwordHash +refreshToken'
        );

        if (user) {
          const isMatch = await bcrypt.compare(password, user.passwordHash);
          if (isMatch) {
            const accessToken = generateAccessToken({
              userId: user._id.toString(),
              email: user.email,
              role: user.role,
              name: user.name,
            });

            const refreshToken = generateRefreshToken({
              userId: user._id.toString(),
            });

            user.refreshToken = refreshToken;
            await user.save();

            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

            res.status(200).json({
              success: true,
              message: 'Authentication successful',
              accessToken,
              user: formatUserResponse(user),
            });
            return;
          }
        }
      } catch (dbErr) {
        console.warn('[Login DB Error - checking memory fallback]', dbErr);
      }
    }

    // Check memory store
    const memUser = memoryUsers.get(cleanEmail);
    if (!memUser) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, memUser.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const accessToken = generateAccessToken({
      userId: memUser._id,
      email: memUser.email,
      role: memUser.role,
      name: memUser.name,
    });

    const refreshToken = generateRefreshToken({
      userId: memUser._id,
    });

    memUser.refreshToken = refreshToken;
    memoryUsers.set(cleanEmail, memUser);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      accessToken,
      user: formatUserResponse(memUser),
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error?.message,
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not provided',
        code: 'NO_REFRESH_TOKEN',
      });
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }

    if (isMongoConnected()) {
      try {
        const user = await User.findById(decoded.userId).select('+refreshToken');
        if (user && user.refreshToken === token) {
          const newAccessToken = generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          });

          const newRefreshToken = generateRefreshToken({
            userId: user._id.toString(),
          });

          user.refreshToken = newRefreshToken;
          await user.save();

          res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

          res.status(200).json({
            success: true,
            message: 'Token rotated successfully',
            accessToken: newAccessToken,
            user: formatUserResponse(user),
          });
          return;
        }
      } catch (dbErr) {
        console.warn('[Refresh DB Error - checking memory fallback]', dbErr);
      }
    }

    // Check in-memory store
    for (const [, user] of memoryUsers.entries()) {
      if (user._id === decoded.userId && user.refreshToken === token) {
        const newAccessToken = generateAccessToken({
          userId: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
        });

        const newRefreshToken = generateRefreshToken({
          userId: user._id,
        });

        user.refreshToken = newRefreshToken;

        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

        res.status(200).json({
          success: true,
          message: 'Token rotated successfully',
          accessToken: newAccessToken,
          user: formatUserResponse(user),
        });
        return;
      }
    }

    res.status(401).json({
      success: false,
      message: 'Refresh token revoked or mismatched',
      code: 'REVOKED_REFRESH_TOKEN',
    });
  } catch (error: any) {
    console.error('[Refresh Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error rotating authentication token',
      error: error?.message,
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        if (isMongoConnected()) {
          await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
        }
        for (const [, user] of memoryUsers.entries()) {
          if (user._id === decoded.userId) {
            user.refreshToken = null;
          }
        }
      } catch (err) {
        // Token might already be invalid
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('[Logout Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error?.message,
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (isMongoConnected()) {
      try {
        const user = await User.findById(userId);
        if (user) {
          res.status(200).json({
            success: true,
            user: formatUserResponse(user),
          });
          return;
        }
      } catch (dbErr) {
        console.warn('[GetMe DB Error - checking memory fallback]', dbErr);
      }
    }

    for (const [, user] of memoryUsers.entries()) {
      if (user._id === userId) {
        res.status(200).json({
          success: true,
          user: formatUserResponse(user),
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      message: 'User profile not found',
      code: 'USER_NOT_FOUND',
    });
  } catch (error: any) {
    console.error('[GetMe Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error?.message,
    });
  }
};

export const updateFaceDescriptor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faceDescriptor } = req.body;
    const userId = req.user?.userId;

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid face descriptor array is required',
      });
      return;
    }

    if (isMongoConnected()) {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          { faceDescriptor },
          { new: true }
        );

        if (user) {
          res.status(200).json({
            success: true,
            message: 'Biometric face descriptor vector enrolled successfully',
            faceDescriptorEnrolled: true,
            user: formatUserResponse(user),
          });
          return;
        }
      } catch (dbErr) {
        console.warn('[UpdateFaceDescriptor DB Error - fallback to memory]', dbErr);
      }
    }

    for (const [, user] of memoryUsers.entries()) {
      if (user._id === userId) {
        user.faceDescriptor = faceDescriptor;
        res.status(200).json({
          success: true,
          message: 'Biometric face descriptor vector enrolled successfully',
          faceDescriptorEnrolled: true,
          user: formatUserResponse(user),
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      message: 'User not found',
    });
  } catch (error: any) {
    console.error('[UpdateFaceDescriptor Error]', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling face descriptor',
      error: error?.message,
    });
  }
};
