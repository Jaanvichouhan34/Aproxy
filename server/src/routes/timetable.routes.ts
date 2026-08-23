import { Router } from 'express';
import {
  getSubjects,
  createSubject,
  getTeacherSchedule,
  getStudentSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getActiveClass,
  seedSampleTimetable,
} from '../controllers/timetable.controller';
import { authenticate, authorize, validate } from '../middleware/auth.middleware';
import {
  createSubjectSchema,
  createScheduleSchema,
  updateScheduleSchema,
} from '../schemas/timetable.schema';

const router = Router();

// ==========================================
// ACTIVE CLASS & REAL-TIME STATUS (All authenticated users)
// ==========================================
router.get('/active-class', authenticate, getActiveClass);

// ==========================================
// SUBJECT MANAGEMENT
// ==========================================
router.get('/subjects', authenticate, getSubjects);
router.post(
  '/subjects',
  authenticate,
  authorize(['teacher']),
  validate(createSubjectSchema),
  createSubject
);

// ==========================================
// TIMETABLE SCHEDULE SLOTS
// ==========================================
// Teacher view
router.get('/teacher', authenticate, authorize(['teacher']), getTeacherSchedule);

// Student view
router.get('/student', authenticate, authorize(['student']), getStudentSchedule);

// Create / Edit / Delete slots (Teacher only)
router.post(
  '/',
  authenticate,
  authorize(['teacher']),
  validate(createScheduleSchema),
  createSchedule
);

router.put(
  '/:id',
  authenticate,
  authorize(['teacher']),
  validate(updateScheduleSchema),
  updateSchedule
);

router.delete('/:id', authenticate, authorize(['teacher']), deleteSchedule);

// Demo seed helper
router.post('/seed-sample', authenticate, authorize(['teacher']), seedSampleTimetable);

export default router;
