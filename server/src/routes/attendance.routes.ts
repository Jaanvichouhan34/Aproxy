import { Router } from 'express';
import {
  startSession,
  endSession,
  getActiveSession,
  verifyQR,
  getStudentHistory,
  getSessionAttendees,
  manualOverrideAttendance,
  getAuditLogs,
  getSessionLiveRoster,
} from '../controllers/attendance.controller';
import { getTeacherAnalytics } from '../controllers/analytics.controller';
import {
  exportSessionPDF,
  exportSessionCSV,
  exportAuditLogsCSV,
} from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protected Routes

// 1. Session Management & Live Broadcaster (Teachers only)
router.post('/session/start', authenticate, authorize(['teacher']), startSession);
router.post('/session/end', authenticate, authorize(['teacher']), endSession);
router.get('/session/active', authenticate, getActiveSession);
router.get('/session/:sessionId/attendees', authenticate, authorize(['teacher']), getSessionAttendees);
router.get('/session/:sessionId/roster', authenticate, authorize(['teacher']), getSessionLiveRoster);

// 2. Manual Override & Audit Trail (Teachers only)
router.post('/override', authenticate, authorize(['teacher']), manualOverrideAttendance);
router.get('/audit-logs', authenticate, authorize(['teacher']), getAuditLogs);

// 3. Analytics & Low Attendance Alerts (Teachers only)
router.get('/analytics/overview', authenticate, authorize(['teacher']), getTeacherAnalytics);

// 4. One-Click Reports & PDF/CSV Export (Teachers only)
router.get('/reports/session/:sessionId/pdf', authenticate, authorize(['teacher']), exportSessionPDF);
router.get('/reports/session/:sessionId/csv', authenticate, authorize(['teacher']), exportSessionCSV);
router.get('/reports/audit-logs/csv', authenticate, authorize(['teacher']), exportAuditLogsCSV);

// 5. Verification & Student Operations (Students only)
router.post('/verify-qr', authenticate, authorize(['student']), verifyQR);
router.get('/history/student', authenticate, authorize(['student']), getStudentHistory);

export default router;
