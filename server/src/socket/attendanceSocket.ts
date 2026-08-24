import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import { AttendanceSession } from '../models/AttendanceSession';
import { Subject } from '../models/Subject';
import qrSessionService from '../services/qrSession.service';

interface SessionIntervalMap {
  [sessionId: string]: NodeJS.Timeout;
}

const activeIntervals: SessionIntervalMap = {};
let ioInstance: Server | null = null;

export const setupAttendanceSocket = (io: Server) => {
  ioInstance = io;
  const attendanceNamespace = io.of('/attendance-session');

  attendanceNamespace.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id} on /attendance-session`);

    // 1. Join an existing active session room
    socket.on('join_session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        if (!sessionId) {
          socket.emit('session_error', { message: 'Missing sessionId' });
          return;
        }

        socket.join(`session:${sessionId}`);
        console.log(`[WebSocket] Socket ${socket.id} joined room session:${sessionId}`);

        // Check if session is already running in-memory or in DB
        let sessionState = qrSessionService.getSessionState(sessionId);
        const dbSession = await AttendanceSession.findById(sessionId).select('+secretKey');

        if (!dbSession || dbSession.status !== 'ACTIVE') {
          socket.emit('session_inactive', { sessionId, message: 'Session is not active' });
          return;
        }

        if (!sessionState && dbSession) {
          // Register in-memory engine from DB record
          sessionState = qrSessionService.registerSession({
            sessionId: dbSession._id.toString(),
            teacherId: dbSession.teacherId.toString(),
            subjectId: dbSession.subjectId.toString(),
            subjectCode: dbSession.subjectCode,
            subjectName: dbSession.subjectName,
            roomNumber: dbSession.roomNumber,
            batch: dbSession.batch,
            secretKey: dbSession.secretKey,
          });

          // Start 1000ms heartbeat if not already started
          startHeartbeat(attendanceNamespace, sessionId);
        }

        // Send immediate initial payload
        const initialPayload = qrSessionService.rotateToken(sessionId);
        if (initialPayload) {
          socket.emit('qr_heartbeat', {
            ...initialPayload,
            totalAttended: dbSession?.totalAttended || 0,
            serverTime: Date.now(),
          });
        }
      } catch (err: any) {
        console.error('[WebSocket join_session error]', err);
        socket.emit('session_error', { message: err.message });
      }
    });

    // 2. Start a new session from teacher UI
    socket.on('start_session', async (payload: {
      teacherId: string;
      subjectId: string;
      subjectCode?: string;
      subjectName?: string;
      roomNumber?: string;
      batch?: string;
      scheduleId?: string;
    }) => {
      try {
        const { teacherId, subjectId, scheduleId } = payload;
        let { subjectCode, subjectName, roomNumber, batch } = payload;

        // Populate subject info if missing
        if (!subjectCode || !subjectName) {
          const subject = await Subject.findById(subjectId);
          if (subject) {
            subjectCode = subject.code;
            subjectName = subject.name;
          } else {
            subjectCode = 'CS402';
            subjectName = 'Network Security';
          }
        }

        roomNumber = roomNumber || 'Hall B-201';
        batch = batch || 'CS-2026-A';

        // Check if there is already an active session for this teacher, and close it
        const existingActive = await AttendanceSession.findOne({
          teacherId,
          status: 'ACTIVE',
        }).select('+secretKey');

        if (existingActive) {
          existingActive.status = 'ENDED';
          existingActive.endedAt = new Date();
          await existingActive.save();
          stopHeartbeat(existingActive._id.toString());
          qrSessionService.unregisterSession(existingActive._id.toString());
        }

        // Generate unique high-entropy session secret key
        const secretKey = crypto.randomBytes(32).toString('hex');

        // Create new session in MongoDB
        const newSession = await AttendanceSession.create({
          teacherId,
          subjectId,
          subjectCode,
          subjectName,
          roomNumber,
          batch,
          scheduleId: scheduleId || null,
          secretKey,
          status: 'ACTIVE',
          startedAt: new Date(),
          totalAttended: 0,
        });

        const sessionId = newSession._id.toString();

        // Register session in memory
        qrSessionService.registerSession({
          sessionId,
          teacherId,
          subjectId,
          subjectCode,
          subjectName,
          roomNumber,
          batch,
          secretKey,
        });

        // Join socket room
        socket.join(`session:${sessionId}`);

        // Start 1000ms WebSocket heartbeat
        startHeartbeat(attendanceNamespace, sessionId);

        socket.emit('session_started', {
          success: true,
          sessionId,
          subjectCode,
          subjectName,
          roomNumber,
          batch,
          startedAt: newSession.startedAt,
        });

        console.log(`[WebSocket] Live attendance session started: ${sessionId} (${subjectCode})`);
      } catch (err: any) {
        console.error('[WebSocket start_session error]', err);
        socket.emit('session_error', { message: err.message });
      }
    });

    // 3. Force instant token rotation
    socket.on('force_rotate', (data: { sessionId: string }) => {
      const { sessionId } = data;
      if (!sessionId) return;

      const payload = qrSessionService.rotateToken(sessionId);
      if (payload) {
        attendanceNamespace.to(`session:${sessionId}`).emit('qr_heartbeat', {
          ...payload,
          serverTime: Date.now(),
        });
      }
    });

    // 4. End session
    socket.on('end_session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        if (!sessionId) return;

        stopHeartbeat(sessionId);
        qrSessionService.unregisterSession(sessionId);

        const session = await AttendanceSession.findById(sessionId);
        if (session && session.status === 'ACTIVE') {
          session.status = 'ENDED';
          session.endedAt = new Date();
          await session.save();
        }

        attendanceNamespace.to(`session:${sessionId}`).emit('session_ended', {
          sessionId,
          endedAt: new Date(),
          totalAttended: session?.totalAttended || 0,
        });

        console.log(`[WebSocket] Live attendance session ended: ${sessionId}`);
      } catch (err: any) {
        console.error('[WebSocket end_session error]', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Start 1000ms high-frequency rotation heartbeat for a live session
 */
const startHeartbeat = (namespace: any, sessionId: string) => {
  if (activeIntervals[sessionId]) {
    clearInterval(activeIntervals[sessionId]);
  }

  // Initial immediate pulse
  const initialPayload = qrSessionService.rotateToken(sessionId);
  if (initialPayload) {
    namespace.to(`session:${sessionId}`).emit('qr_heartbeat', {
      ...initialPayload,
      serverTime: Date.now(),
    });
  }

  // High-frequency 1000ms interval
  activeIntervals[sessionId] = setInterval(async () => {
    const payload = qrSessionService.rotateToken(sessionId);
    if (!payload) {
      stopHeartbeat(sessionId);
      return;
    }

    namespace.to(`session:${sessionId}`).emit('qr_heartbeat', {
      ...payload,
      serverTime: Date.now(),
    });
  }, 1000);
};

/**
 * Stop heartbeat interval
 */
const stopHeartbeat = (sessionId: string) => {
  if (activeIntervals[sessionId]) {
    clearInterval(activeIntervals[sessionId]);
    delete activeIntervals[sessionId];
  }
};

/**
 * Emit student verified event to the teacher broadcaster room in real time
 */
export const broadcastStudentVerified = (sessionId: string, data: {
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  verifiedAt: Date;
  latencyMs: number;
  totalAttended: number;
  verificationMethod: string;
  status?: string;
}) => {
  if (!ioInstance) return;
  const attendanceNamespace = ioInstance.of('/attendance-session');
  attendanceNamespace.to(`session:${sessionId}`).emit('student_verified', data);
};

/**
 * Emit manual override event to the live attendance session room
 */
export const broadcastStudentOverridden = (sessionId: string, data: {
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  teacherName: string;
  timestamp: Date;
  totalAttended: number;
  totalPresent: number;
  totalLate: number;
  totalExcused: number;
}) => {
  if (!ioInstance) return;
  const attendanceNamespace = ioInstance.of('/attendance-session');
  attendanceNamespace.to(`session:${sessionId}`).emit('attendance_overridden', data);
};

