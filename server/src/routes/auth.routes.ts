import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateFaceDescriptor,
} from '../controllers/auth.controller';
import { authenticate, validate } from '../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  faceDescriptorSchema,
} from '../schemas/auth.schema';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/face-descriptor', authenticate, validate(faceDescriptorSchema), updateFaceDescriptor);

export default router;
