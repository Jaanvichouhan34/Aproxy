import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { AttendanceSession } from '../models/AttendanceSession';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { AuditLog } from '../models/AuditLog';
import { Subject } from '../models/Subject';
import { User } from '../models/User';
import qrSessionService from '../services/qrSession.service';
import { broadcastStudentVerified, broadcastStudentOverridden } from '../socket/attendanceSocket';

/**
 * Start a live attendance session (Teacher)
 */
export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.userId;
    const { subjectId, roomNumber = 'Hall B-201', batch = 'CS-2026-A', scheduleId } = req.body;

    if (!subjectId) {
      res.status(400).json({ success: false, message: 'subjectId is required' });
      return;
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    // Close any previous active session by this teacher
    await AttendanceSession.updateMany(
      { teacherId, status: 'ACTIVE' },
      { status: 'ENDED', endedAt: new Date() }
    );

    const secretKey = crypto.randomBytes(32).toString('hex');

    const session = await AttendanceSession.create({
      teacherId,
      subjectId: subject._id,
      subjectCode: subject.code,
      subjectName: subject.name,
      roomNumber,
      batch,
      scheduleId: scheduleId || null,
      secretKey,
      status: 'ACTIVE',
      startedAt: new Date(),
      totalAttended: 0,
    });

    const sessionId = session._id.toString();

    // Register in fast in-memory crypto service
    qrSessionService.registerSession({
      sessionId,
      teacherId,
      subjectId: subject._id.toString(),
      subjectCode: subject.code,
      subjectName: subject.name,
      roomNumber,
      batch,
      secretKey,
    });

    res.status(201).json({
      success: true,
      message: 'Live attendance session initialized',
      session: {
        id: sessionId,
        subjectId: subject._id,
        subjectCode: subject.code,
        subjectName: subject.name,
        roomNumber,
        batch,
        status: session.status,
        startedAt: session.startedAt,
        totalAttended: 0,
      },
    });
  } catch (error: any) {
    console.error('[startSession error]', error);
    res.status(500).json({ success: false, message: 'Failed to start live session', error: error.message });
  }
};

/**
 * End an active attendance session (Teacher)
 */
export const endSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.userId;
    const { sessionId } = req.body;

    const query: any = { teacherId, status: 'ACTIVE' };
    if (sessionId) {
      query._id = sessionId;
    }

    const session = await AttendanceSession.findOne(query);
    if (!session) {
      res.status(404).json({ success: false, message: 'No active session found to end' });
      return;
    }

    session.status = 'ENDED';
    session.endedAt = new Date();
    await session.save();

    qrSessionService.unregisterSession(session._id.toString());

    res.status(200).json({
      success: true,
      message: 'Live session successfully closed',
      session: {
        id: session._id,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        totalAttended: session.totalAttended,
      },
    });
  } catch (error: any) {
    console.error('[endSession error]', error);
    res.status(500).json({ success: false, message: 'Failed to end session', error: error.message });
  }
};

/**
 * Get the currently active session (for Teacher or Student)
 */
export const getActiveSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let session;
    if (role === 'teacher') {
      session = await AttendanceSession.findOne({ teacherId: userId, status: 'ACTIVE' }).sort({
        startedAt: -1,
      });
    } else {
      // Find latest active session for student
      session = await AttendanceSession.findOne({ status: 'ACTIVE' }).sort({ startedAt: -1 });
    }

    if (!session) {
      res.status(200).json({ success: true, active: false, session: null });
      return;
    }

    res.status(200).json({
      success: true,
      active: true,
      session: {
        id: session._id,
        subjectId: session.subjectId,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        roomNumber: session.roomNumber,
        batch: session.batch,
        status: session.status,
        startedAt: session.startedAt,
        totalAttended: session.totalAttended,
      },
    });
  } catch (error: any) {
    console.error('[getActiveSession error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active session' });
  }
};

/**
 * Verify scanned QR code payload and record student attendance
 */
export const verifyQR = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const studentId = req.user!.userId;
    let {
      sessionId,
      token,
      timestamp,
      nonce,
      signature,
      biometricMatched = true,
      similarityScore = 0.95,
    } = req.body;

    // Unpack if a combined base64/JSON token string was provided
    if (token && (!sessionId || !timestamp || !nonce || !signature)) {
      try {
        let parsed: any;
        if (typeof token === 'string' && token.startsWith('{')) {
          parsed = JSON.parse(token);
        } else {
          parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
        }
        sessionId = sessionId || parsed.sessionId || parsed.s;
        timestamp = timestamp || parsed.timestamp || parsed.t;
        nonce = nonce || parsed.nonce || parsed.n;
        signature = signature || parsed.signature || parsed.sig;
      } catch (parseErr) {
        // Fallback to direct properties
      }
    }

    if (!sessionId || !timestamp || !nonce || !signature) {
      res.status(400).json({
        success: false,
        code: 'MALFORMED_PAYLOAD',
        message: 'Invalid QR payload. Missing sessionId, timestamp, nonce, or signature.',
      });
      return;
    }

    timestamp = Number(timestamp);

    // 1. Fetch DB session if needed for fallback secret key
    let fallbackSecretKey: string | undefined;
    let session = await AttendanceSession.findById(sessionId).select('+secretKey');

    if (!session || session.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        code: 'SESSION_INACTIVE',
        message: 'This attendance session is no longer active or does not exist.',
      });
      return;
    }

    fallbackSecretKey = session.secretKey;

    // 2. Perform Cryptographic, Drift, and Anti-Replay Verification
    const verification = qrSessionService.verifyTokenPayload({
      sessionId,
      studentId,
      timestamp,
      nonce,
      signature,
      fallbackSecretKey,
    });

    if (!verification.valid) {
      res.status(400).json({
        success: false,
        code: verification.errorCode,
        message: verification.message,
      });
      return;
    }

    // 3. Check student profile & details
    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: 'Student account not found.',
      });
      return;
    }

    // 4. Atomic idempotency check: Has student already marked attendance for this session?
    const existingRecord = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: studentUser._id,
    });

    if (existingRecord) {
      res.status(409).json({
        success: false,
        code: 'ALREADY_ATTENDED',
        message: `Attendance already recorded for ${session.subjectCode} at ${existingRecord.verifiedAt.toLocaleTimeString()}`,
        record: existingRecord,
      });
      return;
    }

    // 5. Server-Side Biometric Vector Verification (if live descriptor provided)
    const { liveFaceDescriptor, isFallback = false } = req.body;
    let computedBiometricMatched = Boolean(biometricMatched);
    let computedSimilarityScore = Number(similarityScore) || 0.95;
    let method: 'DYNAMIC_QR' | 'BIOMETRIC_QR' | 'MANUAL_OVERRIDE' = computedBiometricMatched
      ? 'BIOMETRIC_QR'
      : 'DYNAMIC_QR';

    if (isFallback) {
      method = 'MANUAL_OVERRIDE';
      computedBiometricMatched = false;
    } else if (
      Array.isArray(liveFaceDescriptor) &&
      liveFaceDescriptor.length === 128 &&
      Array.isArray(studentUser.faceDescriptor) &&
      studentUser.faceDescriptor.length === 128
    ) {
      // Calculate Euclidean distance
      let sumSq = 0;
      let dotProd = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < 128; i++) {
        const diff = liveFaceDescriptor[i] - studentUser.faceDescriptor[i];
        sumSq += diff * diff;
        dotProd += liveFaceDescriptor[i] * studentUser.faceDescriptor[i];
        normA += liveFaceDescriptor[i] * liveFaceDescriptor[i];
        normB += studentUser.faceDescriptor[i] * studentUser.faceDescriptor[i];
      }
      const euclideanDist = Math.sqrt(sumSq);
      const cosSim = normA > 0 && normB > 0 ? dotProd / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;

      // Threshold check: Euclidean distance <= 0.45 is standard face-api match
      if (euclideanDist <= 0.45 || cosSim >= 0.70) {
        computedBiometricMatched = true;
        computedSimilarityScore = Number(cosSim.toFixed(4));
        method = 'BIOMETRIC_QR';
      } else {
        res.status(403).json({
          success: false,
          code: 'BIOMETRIC_MISMATCH',
          message: `Biometric verification failed (Euclidean distance ${euclideanDist.toFixed(3)} > 0.45 threshold). Photo spoof or proxy attempt flagged.`,
        });
        return;
      }
    }

    const latencyMs = Date.now() - startTime;

    // 6. Create new verified attendance record
    const attendanceRecord = await AttendanceRecord.create({
      sessionId: session._id,
      studentId: studentUser._id,
      studentName: studentUser.name,
      enrollmentNumber: studentUser.enrollmentNumber || '2024-CS-000',
      department: studentUser.department || session.batch,
      subjectId: session.subjectId,
      verifiedAt: new Date(),
      verificationMethod: method,
      nonce,
      latencyMs,
      biometricMatched: computedBiometricMatched,
      similarityScore: computedSimilarityScore,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // Increment session attendee count atomically
    session.totalAttended = (session.totalAttended || 0) + 1;
    await session.save();

    // 6. Broadcast real-time event to Teacher Broadcaster WebSocket room
    broadcastStudentVerified(sessionId, {
      studentId: studentUser._id.toString(),
      studentName: studentUser.name,
      enrollmentNumber: studentUser.enrollmentNumber || '2024-CS-000',
      verifiedAt: attendanceRecord.verifiedAt,
      latencyMs,
      totalAttended: session.totalAttended,
      verificationMethod: attendanceRecord.verificationMethod,
    });

    res.status(200).json({
      success: true,
      message: `Attendance cryptographically verified for ${session.subjectCode} - ${session.subjectName}`,
      record: {
        id: attendanceRecord._id,
        sessionId: session._id,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        roomNumber: session.roomNumber,
        studentName: studentUser.name,
        enrollmentNumber: studentUser.enrollmentNumber,
        verifiedAt: attendanceRecord.verifiedAt,
        latencyMs,
        nonce,
        signature: signature.substring(0, 16) + '...',
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Mongo duplicate key error on compound index
      res.status(409).json({
        success: false,
        code: 'ALREADY_ATTENDED',
        message: 'Attendance was already recorded for this session.',
      });
      return;
    }
    console.error('[verifyQR error]', error);
    res.status(500).json({
      success: false,
      code: 'VERIFICATION_ERROR',
      message: 'Failed to verify attendance. Server error.',
      error: error.message,
    });
  }
};

/**
 * Get attendance records for the logged-in student
 */
export const getStudentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;

    const records = await AttendanceRecord.find({ studentId })
      .populate('subjectId', 'name code department colorTag')
      .populate('sessionId', 'roomNumber batch startedAt endedAt')
      .sort({ verifiedAt: -1 })
      .limit(50);

    const totalVerified = await AttendanceRecord.countDocuments({ studentId });

    res.status(200).json({
      success: true,
      totalVerified,
      records,
    });
  } catch (error: any) {
    console.error('[getStudentHistory error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance history' });
  }
};

/**
 * Get attendees list for a specific teacher session
 */
export const getSessionAttendees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const attendees = await AttendanceRecord.find({ sessionId: session._id }).sort({
      verifiedAt: -1,
    });

    res.status(200).json({
      success: true,
      session,
      totalAttended: attendees.length,
      attendees,
    });
  } catch (error: any) {
    console.error('[getSessionAttendees error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session attendees' });
  }
};

/**
 * Faculty Manual Attendance Override with Mandatory Audit Logging
 */
export const manualOverrideAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.userId;
    const {
      sessionId,
      studentId,
      enrollmentNumber,
      newStatus = 'PRESENT',
      reason,
      notes = '',
    } = req.body;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Mandatory override reason must be provided (e.g. Device Camera Malfunction, Permission Slip, etc.)',
      });
      return;
    }

    // 1. Verify Teacher and Session
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher account not found' });
      return;
    }

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Attendance session not found' });
      return;
    }

    // 2. Find Student by studentId or enrollmentNumber
    let student;
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await User.findById(studentId);
    } else if (enrollmentNumber) {
      student = await User.findOne({ enrollmentNumber: enrollmentNumber.toUpperCase() });
    }

    if (!student) {
      // If studentId was not found, check if studentId was enrollmentNumber or name
      student = await User.findOne({
        $or: [
          { enrollmentNumber: studentId?.toUpperCase() },
          { name: studentId },
        ],
      });
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found in institutional directory' });
      return;
    }

    // 3. Find existing attendance record if any
    let existingRecord = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: student._id,
    });

    const oldStatus = existingRecord ? (existingRecord.status || 'PRESENT') : 'ABSENT';

    let record;
    if (existingRecord) {
      existingRecord.status = newStatus;
      existingRecord.verificationMethod = 'MANUAL_OVERRIDE';
      existingRecord.isManualOverride = true;
      existingRecord.overrideReason = reason;
      existingRecord.overriddenBy = teacher._id;
      existingRecord.overriddenAt = new Date();
      existingRecord.notes = notes;
      record = await existingRecord.save();
    } else {
      record = await AttendanceRecord.create({
        sessionId: session._id,
        studentId: student._id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber || '2024-CS-000',
        department: student.department || session.batch,
        subjectId: session.subjectId,
        verifiedAt: new Date(),
        verificationMethod: 'MANUAL_OVERRIDE',
        status: newStatus,
        nonce: `0xOVERRIDE_${Date.now().toString(16).toUpperCase()}`,
        latencyMs: 12,
        biometricMatched: false,
        similarityScore: 1.0,
        isManualOverride: true,
        overrideReason: reason,
        overriddenBy: teacher._id,
        overriddenAt: new Date(),
        notes: notes,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    }

    // 4. Create immutable Audit Log entry
    const auditLog = await AuditLog.create({
      teacherId: teacher._id,
      teacherName: teacher.name,
      studentId: student._id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber || '2024-CS-000',
      sessionId: session._id,
      subjectCode: session.subjectCode,
      subjectName: session.subjectName,
      oldStatus,
      newStatus,
      reason,
      notes,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    });

    // 5. Update session attendee counts
    const allSessionRecords = await AttendanceRecord.find({ sessionId: session._id });
    const presentCount = allSessionRecords.filter((r) => r.status === 'PRESENT' || !r.status).length;
    const lateCount = allSessionRecords.filter((r) => r.status === 'LATE').length;
    const excusedCount = allSessionRecords.filter((r) => r.status === 'EXCUSED').length;
    const totalAttended = presentCount + lateCount;

    session.totalAttended = totalAttended;
    await session.save();

    // 6. Broadcast Real-Time WebSocket Event to Teacher Command Center
    broadcastStudentOverridden(session._id.toString(), {
      studentId: student._id.toString(),
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber || '2024-CS-000',
      oldStatus,
      newStatus,
      reason,
      teacherName: teacher.name,
      timestamp: auditLog.timestamp,
      totalAttended,
      totalPresent: presentCount,
      totalLate: lateCount,
      totalExcused: excusedCount,
    });

    res.status(200).json({
      success: true,
      message: `Manual override applied: Marked ${student.name} as ${newStatus}`,
      auditLogId: auditLog._id,
      record,
      totals: {
        totalAttended,
        presentCount,
        lateCount,
        excusedCount,
      },
    });
  } catch (error: any) {
    console.error('[manualOverrideAttendance error]', error);
    res.status(500).json({ success: false, message: 'Failed to apply manual override', error: error.message });
  }
};

/**
 * Get all manual override audit logs for Faculty
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, studentId, teacherId, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (sessionId) query.sessionId = sessionId;
    if (studentId) query.studentId = studentId;
    if (teacherId) query.teacherId = teacherId;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      logs,
    });
  } catch (error: any) {
    console.error('[getAuditLogs error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};

/**
 * Get full live roster for an active session with real-time status for every student
 */
export const getSessionLiveRoster = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Fetch enrolled students
    const enrolledStudents = await User.find({
      role: 'student',
      $or: [{ department: session.batch }, { department: 'Computer Science & Engineering' }],
    }).sort({ enrollmentNumber: 1 });

    // Fetch verified attendance records for this session
    const records = await AttendanceRecord.find({ sessionId: session._id });
    const recordMap = new Map<string, any>();
    records.forEach((r) => {
      recordMap.set(r.studentId.toString(), r);
      if (r.enrollmentNumber) recordMap.set(r.enrollmentNumber, r);
    });

    const roster = (enrolledStudents.length > 0 ? enrolledStudents : [
      { _id: 'std-1', name: 'Alex Rivera', enrollmentNumber: '2024-CS-089', email: 'alex.rivera@university.edu', department: session.batch },
      { _id: 'std-2', name: 'Elena Rostova', enrollmentNumber: '2024-CS-042', email: 'elena.rostova@university.edu', department: session.batch },
      { _id: 'std-3', name: 'Kavita Sharma', enrollmentNumber: '2024-CS-112', email: 'kavita.sharma@university.edu', department: session.batch },
      { _id: 'std-4', name: 'David Chen', enrollmentNumber: '2024-CS-015', email: 'david.chen@university.edu', department: session.batch },
      { _id: 'std-5', name: 'Priya Patel', enrollmentNumber: '2024-CS-088', email: 'priya.patel@university.edu', department: session.batch },
      { _id: 'std-6', name: 'Liam Vance', enrollmentNumber: '2024-CS-077', email: 'liam.vance@university.edu', department: session.batch },
      { _id: 'std-7', name: 'Marcus Brody', enrollmentNumber: '2024-CS-031', email: 'marcus.brody@university.edu', department: session.batch },
    ]).map((student: any, idx: number) => {
      const rec = recordMap.get(student._id.toString()) || recordMap.get(student.enrollmentNumber || '');
      return {
        id: student._id.toString(),
        studentId: student._id.toString(),
        name: student.name,
        rollNo: student.enrollmentNumber || `2024-CS-${String(idx + 1).padStart(3, '0')}`,
        email: student.email,
        department: student.department || session.batch,
        status: rec ? (rec.status || 'PRESENT') : 'ABSENT',
        verifiedAt: rec ? rec.verifiedAt : null,
        verificationMethod: rec ? rec.verificationMethod : null,
        latencyMs: rec ? rec.latencyMs : null,
        nonce: rec ? rec.nonce : null,
        similarityScore: rec ? rec.similarityScore : null,
        isManualOverride: rec ? Boolean(rec.isManualOverride) : false,
        overrideReason: rec ? rec.overrideReason : null,
      };
    });

    const totalPresent = roster.filter((r: any) => r.status === 'PRESENT').length;
    const totalLate = roster.filter((r: any) => r.status === 'LATE').length;
    const totalExcused = roster.filter((r: any) => r.status === 'EXCUSED').length;
    const totalAbsent = roster.filter((r: any) => r.status === 'ABSENT').length;
    const totalEnrolled = roster.length;

    res.status(200).json({
      success: true,
      session: {
        id: session._id,
        subjectCode: session.subjectCode,
        subjectName: session.subjectName,
        roomNumber: session.roomNumber,
        batch: session.batch,
        status: session.status,
        startedAt: session.startedAt,
      },
      stats: {
        totalEnrolled,
        totalPresent,
        totalLate,
        totalExcused,
        totalAbsent,
        attendanceRate: totalEnrolled > 0 ? Number((((totalPresent + totalLate) / totalEnrolled) * 100).toFixed(1)) : 0,
      },
      roster,
    });
  } catch (error: any) {
    console.error('[getSessionLiveRoster error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch live roster', error: error.message });
  }
};

