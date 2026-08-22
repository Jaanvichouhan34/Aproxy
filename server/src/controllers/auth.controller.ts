import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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

const formatUserResponse = (user: IUser) => {
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

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: 'An account with this institutional email already exists',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    // If student, check if enrollment number already exists
    if (role === 'student' && enrollmentNumber) {
      const existingEnrollment = await User.findOne({
        enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
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
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      enrollmentNumber: role === 'student' ? enrollmentNumber?.trim().toUpperCase() : undefined,
      department: department?.trim() || 'Computer Science & Engineering',
      faceDescriptor: Array.isArray(faceDescriptor) ? faceDescriptor : [],
    });

    const savedUser = await newUser.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
      name: savedUser.name,
    });

    const refreshToken = generateRefreshToken({
      userId: savedUser._id.toString(),
    });

    // Save refresh token to user
    savedUser.refreshToken = refreshToken;
    await savedUser.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      accessToken,
      user: formatUserResponse(savedUser),
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

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+passwordHash +refreshToken'
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      accessToken,
      user: formatUserResponse(user),
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

    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      res.status(401).json({
        success: false,
        message: 'Refresh token revoked or mismatched',
        code: 'REVOKED_REFRESH_TOKEN',
      });
      return;
    }

    // Token rotation: generate new access & refresh tokens
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
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
      } catch (err) {
        // Token might already be invalid, proceed to clear cookie
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
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: formatUserResponse(user),
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

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid face descriptor array is required',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { faceDescriptor },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Biometric face descriptor vector enrolled successfully',
      faceDescriptorEnrolled: true,
      user: formatUserResponse(user),
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
