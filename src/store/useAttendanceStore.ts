import { create } from 'zustand';
import api from '../lib/api';
import { getAttendanceSocket } from '../lib/socket';
import { playSuccessChime, playErrorBuzzer } from '../lib/audio';

export interface AttendancePayload {
  sessionId: string;
  token: string;
  timestamp: number;
  nonce: string;
  signature: string;
  validityMs: number;
}

export interface LiveSessionInfo {
  id: string;
  subjectId?: string;
  subjectCode: string;
  subjectName: string;
  roomNumber: string;
  batch: string;
  startedAt: string | Date;
  status: 'ACTIVE' | 'ENDED';
  totalAttended: number;
}

export interface StreamAuditLog {
  id: string;
  studentName: string;
  enrollmentNumber: string;
  time: string;
  latencyMs: number;
  status: 'VERIFIED' | 'REJECTED' | 'OVERRIDDEN';
  method: string;
}

export interface LiveRosterStudent {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  status: 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';
  verifiedAt?: string | null;
  verificationMethod?: string | null;
  latencyMs?: number | null;
  nonce?: string | null;
  similarityScore?: number | null;
  isManualOverride?: boolean;
  overrideReason?: string | null;
}

export interface SessionStats {
  totalEnrolled: number;
  totalPresent: number;
  totalLate: number;
  totalExcused: number;
  totalAbsent: number;
  attendanceRate: number;
}

export interface AuditLogEntry {
  _id: string;
  teacherId?: string;
  teacherName: string;
  studentId?: string;
  studentName: string;
  enrollmentNumber: string;
  sessionId: string;
  subjectCode?: string;
  subjectName?: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  notes?: string;
  ipAddress?: string;
  timestamp: string;
}

interface AttendanceState {
  // Session Broadcaster State
  activeSession: LiveSessionInfo | null;
  currentPayload: AttendancePayload | null;
  countdown: number; // 1000ms countdown in ms
  progressPercent: number; // 0% to 100%
  isConnected: boolean;
  isBroadcasting: boolean;
  totalEnrolled: number;
  streamLogs: StreamAuditLog[];
  soundEnabled: boolean;

  // Live Roster & Command Center State
  liveRoster: LiveRosterStudent[];
  sessionStats: SessionStats;
  isLoadingRoster: boolean;

  // Audit Logs State
  auditLogs: AuditLogEntry[];
  totalAuditLogs: number;
  isLoadingAuditLogs: boolean;

  // Student Scan State
  lastScanResult: {
    success: boolean;
    message: string;
    record?: any;
    errorCode?: string;
    latencyMs?: number;
  } | null;
  isVerifying: boolean;

  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  startLiveSession: (params: {
    subjectId: string;
    subjectCode?: string;
    subjectName?: string;
    roomNumber?: string;
    batch?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  endLiveSession: () => Promise<void>;
  forceRotate: () => void;
  joinSessionRoom: (sessionId: string) => void;
  checkActiveSession: () => Promise<void>;
  fetchLiveRoster: (sessionId: string) => Promise<void>;
  manualOverride: (params: {
    sessionId: string;
    studentId: string;
    newStatus: 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';
    reason: string;
    notes?: string;
  }) => Promise<{ success: boolean; message: string }>;
  fetchAuditLogs: (filters?: any) => Promise<void>;
  verifyScannedPayload: (
    qrData: string | object,
    biometricMeta?: {
      liveFaceDescriptor?: number[];
      biometricMatched?: boolean;
      similarityScore?: number;
      isFallback?: boolean;
    }
  ) => Promise<{
    success: boolean;
    message: string;
    record?: any;
    errorCode?: string;
  }>;
  clearLastScan: () => void;
}

let countdownTimer: any = null;
let lastHeartbeatTimestamp = Date.now();

const defaultSampleRoster: LiveRosterStudent[] = [
  {
    id: 'std-1',
    studentId: 'std-1',
    name: 'Alex Rivera',
    rollNo: '2024-CS-089',
    email: 'alex.rivera@university.edu',
    department: 'CS-2026-A',
    status: 'PRESENT',
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'BIOMETRIC_QR',
    latencyMs: 24,
    nonce: '0x8F3A2B1C',
  },
  {
    id: 'std-2',
    studentId: 'std-2',
    name: 'Elena Rostova',
    rollNo: '2024-CS-042',
    email: 'elena.rostova@university.edu',
    department: 'CS-2026-A',
    status: 'PRESENT',
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'BIOMETRIC_QR',
    latencyMs: 19,
    nonce: '0x1C99A4DF',
  },
  {
    id: 'std-3',
    studentId: 'std-3',
    name: 'Kavita Sharma',
    rollNo: '2024-CS-112',
    email: 'kavita.sharma@university.edu',
    department: 'CS-2026-A',
    status: 'PRESENT',
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'BIOMETRIC_QR',
    latencyMs: 31,
    nonce: '0x7B01EE45',
  },
  {
    id: 'std-4',
    studentId: 'std-4',
    name: 'David Chen',
    rollNo: '2024-CS-015',
    email: 'david.chen@university.edu',
    department: 'CS-2026-A',
    status: 'PRESENT',
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'DYNAMIC_QR',
    latencyMs: 22,
    nonce: '0x4E9281BC',
  },
  {
    id: 'std-5',
    studentId: 'std-5',
    name: 'Priya Patel',
    rollNo: '2024-CS-088',
    email: 'priya.patel@university.edu',
    department: 'CS-2026-A',
    status: 'PRESENT',
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'DYNAMIC_QR',
    latencyMs: 28,
    nonce: '0x99A043FF',
  },
  {
    id: 'std-6',
    studentId: 'std-6',
    name: 'Liam Vance',
    rollNo: '2024-CS-077',
    email: 'liam.vance@university.edu',
    department: 'CS-2026-A',
    status: 'ABSENT',
  },
  {
    id: 'std-7',
    studentId: 'std-7',
    name: 'Marcus Brody',
    rollNo: '2024-CS-031',
    email: 'marcus.brody@university.edu',
    department: 'CS-2026-A',
    status: 'ABSENT',
  },
  {
    id: 'std-8',
    studentId: 'std-8',
    name: 'Amina Al-Mansoor',
    rollNo: '2024-CS-004',
    email: 'amina.mansoor@university.edu',
    department: 'CS-2026-A',
    status: 'ABSENT',
  },
];

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  activeSession: null,
  currentPayload: null,
  countdown: 1000,
  progressPercent: 100,
  isConnected: false,
  isBroadcasting: false,
  totalEnrolled: 64,
  streamLogs: [
    {
      id: 'log-seed-1',
      studentName: 'Alex Rivera',
      enrollmentNumber: '2024-CS-089',
      time: '02:30:12',
      latencyMs: 24,
      status: 'VERIFIED',
      method: 'Face Biometric 128D + Seed Nonce',
    },
    {
      id: 'log-seed-2',
      studentName: 'Elena Rostova',
      enrollmentNumber: '2024-CS-042',
      time: '02:30:13',
      latencyMs: 19,
      status: 'VERIFIED',
      method: 'Face Biometric 128D + Seed Nonce',
    },
    {
      id: 'log-seed-3',
      studentName: 'Liam Vance (Proxy Attempt)',
      enrollmentNumber: '2024-CS-077',
      time: '02:30:17',
      latencyMs: 1420,
      status: 'REJECTED',
      method: 'Screenshot Replay Flagged (>1000ms)',
    },
    {
      id: 'log-seed-4',
      studentName: 'David Chen',
      enrollmentNumber: '2024-CS-015',
      time: '02:30:19',
      latencyMs: 22,
      status: 'VERIFIED',
      method: 'Dynamic Rotating QR',
    },
  ],
  soundEnabled: true,
  lastScanResult: null,
  isVerifying: false,

  liveRoster: defaultSampleRoster,
  sessionStats: {
    totalEnrolled: 64,
    totalPresent: 5,
    totalLate: 0,
    totalExcused: 0,
    totalAbsent: 59,
    attendanceRate: 7.8,
  },
  isLoadingRoster: false,

  auditLogs: [
    {
      _id: 'audit-seed-1',
      teacherName: 'Dr. Marcus Vance',
      studentName: 'Elena Rostova',
      enrollmentNumber: '2024-CS-042',
      sessionId: 'sess-live-prev',
      subjectCode: 'CS402',
      oldStatus: 'ABSENT',
      newStatus: 'PRESENT',
      reason: 'Device Camera Malfunction',
      notes: 'Verified physically in Hall B-201 3rd row',
      ipAddress: '192.168.1.45',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'audit-seed-2',
      teacherName: 'Dr. Marcus Vance',
      studentName: 'Priya Patel',
      enrollmentNumber: '2024-CS-088',
      sessionId: 'sess-live-prev',
      subjectCode: 'CS405',
      oldStatus: 'ABSENT',
      newStatus: 'EXCUSED',
      reason: 'Medical Emergency / Official Duty',
      notes: 'Medical certificate approved by academic dean',
      ipAddress: '192.168.1.45',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  totalAuditLogs: 2,
  isLoadingAuditLogs: false,

  setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),

  clearLastScan: () => set({ lastScanResult: null }),

  startLiveSession: async (params) => {
    try {
      const socket = getAttendanceSocket();
      if (!socket.connected) {
        socket.connect();
      }

      // Call REST API to initialize session in database
      const response = await api.post('/attendance/session/start', params);
      if (response.data.success && response.data.session) {
        const session = response.data.session;

        set({
          activeSession: session,
          isBroadcasting: true,
        });

        // Join room and setup socket listeners
        get().joinSessionRoom(session.id);
        get().fetchLiveRoster(session.id);
        return { success: true, message: 'Live session started' };
      }

      return { success: false, message: response.data.message || 'Failed to start session' };
    } catch (error: any) {
      console.error('[startLiveSession error]', error);
      // Fallback sandbox mode
      const mockSession: LiveSessionInfo = {
        id: 'sess-' + Date.now(),
        subjectCode: params.subjectCode || 'CS402',
        subjectName: params.subjectName || 'Network Security & Cryptography',
        roomNumber: params.roomNumber || 'Hall B-201',
        batch: params.batch || 'CS-2026-A',
        startedAt: new Date(),
        status: 'ACTIVE',
        totalAttended: 5,
      };

      set({
        activeSession: mockSession,
        isBroadcasting: true,
      });

      get().joinSessionRoom(mockSession.id);
      return { success: true, message: 'Live session active (Sandbox Mode)' };
    }
  },

  fetchLiveRoster: async (sessionId: string) => {
    set({ isLoadingRoster: true });
    try {
      const res = await api.get(`/attendance/session/${sessionId}/roster`);
      if (res.data.success && res.data.roster) {
        set({
          liveRoster: res.data.roster,
          sessionStats: res.data.stats || {
            totalEnrolled: res.data.roster.length,
            totalPresent: res.data.roster.filter((r: any) => r.status === 'PRESENT').length,
            totalLate: res.data.roster.filter((r: any) => r.status === 'LATE').length,
            totalExcused: res.data.roster.filter((r: any) => r.status === 'EXCUSED').length,
            totalAbsent: res.data.roster.filter((r: any) => r.status === 'ABSENT').length,
            attendanceRate: res.data.stats?.attendanceRate || 0,
          },
          totalEnrolled: res.data.stats?.totalEnrolled || res.data.roster.length || 64,
          isLoadingRoster: false,
        });
      }
    } catch (err) {
      set({ isLoadingRoster: false });
    }
  },

  manualOverride: async (params) => {
    try {
      const res = await api.post('/attendance/override', params);
      if (res.data.success) {
        if (get().soundEnabled) {
          playSuccessChime();
        }

        // Update local roster immediately
        set((state) => {
          const updatedRoster = state.liveRoster.map((item) => {
            if (
              item.id === params.studentId ||
              item.studentId === params.studentId ||
              item.rollNo === params.studentId
            ) {
              return {
                ...item,
                status: params.newStatus,
                isManualOverride: true,
                overrideReason: params.reason,
                verifiedAt: new Date().toISOString(),
                verificationMethod: 'MANUAL_OVERRIDE',
              };
            }
            return item;
          });

          const totalPresent = updatedRoster.filter((r) => r.status === 'PRESENT').length;
          const totalLate = updatedRoster.filter((r) => r.status === 'LATE').length;
          const totalExcused = updatedRoster.filter((r) => r.status === 'EXCUSED').length;
          const totalAbsent = updatedRoster.filter((r) => r.status === 'ABSENT').length;
          const totalEnrolled = updatedRoster.length;
          const attendanceRate = totalEnrolled > 0 ? Number((((totalPresent + totalLate) / totalEnrolled) * 100).toFixed(1)) : 0;

          const overrideLog: StreamAuditLog = {
            id: 'log-override-' + Date.now(),
            studentName: params.studentId,
            enrollmentNumber: 'OVERRIDE',
            time: new Date().toLocaleTimeString(),
            latencyMs: 12,
            status: 'OVERRIDDEN',
            method: `Manual Override (${params.newStatus})`,
          };

          return {
            liveRoster: updatedRoster,
            sessionStats: {
              totalEnrolled,
              totalPresent,
              totalLate,
              totalExcused,
              totalAbsent,
              attendanceRate,
            },
            streamLogs: [overrideLog, ...state.streamLogs.slice(0, 29)],
            activeSession: state.activeSession
              ? {
                  ...state.activeSession,
                  totalAttended: totalPresent + totalLate,
                }
              : null,
          };
        });

        // Refresh audit logs
        get().fetchAuditLogs();

        return {
          success: true,
          message: res.data.message || `Manual override applied: Marked as ${params.newStatus}`,
        };
      }
      return { success: false, message: res.data.message || 'Override failed' };
    } catch (error: any) {
      console.error('[manualOverride error]', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to apply manual override',
      };
    }
  },

  fetchAuditLogs: async (filters = {}) => {
    set({ isLoadingAuditLogs: true });
    try {
      const res = await api.get('/attendance/audit-logs', { params: filters });
      if (res.data.success && res.data.logs) {
        set({
          auditLogs: res.data.logs,
          totalAuditLogs: res.data.total || res.data.logs.length,
          isLoadingAuditLogs: false,
        });
      }
    } catch (err) {
      set({ isLoadingAuditLogs: false });
    }
  },

  joinSessionRoom: (sessionId: string) => {
    const socket = getAttendanceSocket();
    if (!socket.connected) {
      socket.connect();
    }

    set({ isConnected: true });

    socket.emit('join_session', { sessionId });

    // Remove any existing duplicate listeners
    socket.off('qr_heartbeat');
    socket.off('student_verified');
    socket.off('attendance_overridden');
    socket.off('session_ended');

    // Setup local countdown heartbeat timer
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      const elapsed = Date.now() - lastHeartbeatTimestamp;
      const remaining = Math.max(0, 1000 - (elapsed % 1000));
      const percent = (remaining / 1000) * 100;
      set({ countdown: remaining, progressPercent: percent });
    }, 50);

    // 1. Live QR Heartbeat (every 1000ms)
    socket.on('qr_heartbeat', (data: AttendancePayload & { totalAttended?: number }) => {
      lastHeartbeatTimestamp = Date.now();
      set((state) => ({
        currentPayload: data,
        activeSession: state.activeSession
          ? {
              ...state.activeSession,
              totalAttended:
                data.totalAttended !== undefined
                  ? data.totalAttended
                  : state.activeSession.totalAttended,
            }
          : null,
      }));
    });

    // 2. Real-time Student Check-in Event
    socket.on('student_verified', (data: {
      studentId: string;
      studentName: string;
      enrollmentNumber: string;
      verifiedAt: string;
      latencyMs: number;
      totalAttended: number;
      verificationMethod: string;
    }) => {
      if (get().soundEnabled) {
        playSuccessChime();
      }

      const newLog: StreamAuditLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        studentName: data.studentName,
        enrollmentNumber: data.enrollmentNumber,
        time: new Date(data.verifiedAt).toLocaleTimeString(),
        latencyMs: data.latencyMs,
        status: 'VERIFIED',
        method: data.verificationMethod === 'BIOMETRIC_QR' ? 'Face Biometric 128D' : 'Dynamic Rotating QR',
      };

      set((state) => {
        // Update student inside live roster
        const updatedRoster = state.liveRoster.map((item) => {
          if (
            item.studentId === data.studentId ||
            item.rollNo === data.enrollmentNumber ||
            item.name === data.studentName
          ) {
            return {
              ...item,
              status: 'PRESENT' as const,
              verifiedAt: data.verifiedAt,
              verificationMethod: data.verificationMethod,
              latencyMs: data.latencyMs,
            };
          }
          return item;
        });

        const totalPresent = updatedRoster.filter((r) => r.status === 'PRESENT').length;
        const totalLate = updatedRoster.filter((r) => r.status === 'LATE').length;
        const totalExcused = updatedRoster.filter((r) => r.status === 'EXCUSED').length;
        const totalAbsent = updatedRoster.filter((r) => r.status === 'ABSENT').length;
        const totalEnrolled = updatedRoster.length;
        const attendanceRate = totalEnrolled > 0 ? Number((((totalPresent + totalLate) / totalEnrolled) * 100).toFixed(1)) : 0;

        return {
          streamLogs: [newLog, ...state.streamLogs.slice(0, 29)],
          liveRoster: updatedRoster,
          sessionStats: {
            totalEnrolled,
            totalPresent,
            totalLate,
            totalExcused,
            totalAbsent,
            attendanceRate,
          },
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                totalAttended: data.totalAttended || totalPresent,
              }
            : null,
        };
      });
    });

    // 3. Real-time Attendance Overridden Event
    socket.on('attendance_overridden', (data: {
      studentId: string;
      studentName: string;
      enrollmentNumber: string;
      oldStatus: string;
      newStatus: string;
      reason: string;
      teacherName: string;
      timestamp: string;
      totalAttended: number;
      totalPresent: number;
      totalLate: number;
      totalExcused: number;
    }) => {
      const overrideLog: StreamAuditLog = {
        id: 'log-override-' + Date.now(),
        studentName: `${data.studentName} (By ${data.teacherName})`,
        enrollmentNumber: data.enrollmentNumber,
        time: new Date(data.timestamp).toLocaleTimeString(),
        latencyMs: 12,
        status: 'OVERRIDDEN',
        method: `Manual Override -> ${data.newStatus} (${data.reason})`,
      };

      set((state) => {
        const updatedRoster = state.liveRoster.map((item) => {
          if (
            item.studentId === data.studentId ||
            item.rollNo === data.enrollmentNumber ||
            item.name === data.studentName
          ) {
            return {
              ...item,
              status: data.newStatus as any,
              isManualOverride: true,
              overrideReason: data.reason,
            };
          }
          return item;
        });

        const totalPresent = data.totalPresent || updatedRoster.filter((r) => r.status === 'PRESENT').length;
        const totalLate = data.totalLate || updatedRoster.filter((r) => r.status === 'LATE').length;
        const totalExcused = data.totalExcused || updatedRoster.filter((r) => r.status === 'EXCUSED').length;
        const totalAbsent = Math.max(0, updatedRoster.length - (totalPresent + totalLate + totalExcused));
        const totalEnrolled = updatedRoster.length;
        const attendanceRate = totalEnrolled > 0 ? Number((((totalPresent + totalLate) / totalEnrolled) * 100).toFixed(1)) : 0;

        return {
          streamLogs: [overrideLog, ...state.streamLogs.slice(0, 29)],
          liveRoster: updatedRoster,
          sessionStats: {
            totalEnrolled,
            totalPresent,
            totalLate,
            totalExcused,
            totalAbsent,
            attendanceRate,
          },
          activeSession: state.activeSession
            ? {
                ...state.activeSession,
                totalAttended: data.totalAttended || totalPresent + totalLate,
              }
            : null,
        };
      });
    });

    // 4. Session Termination
    socket.on('session_ended', () => {
      if (countdownTimer) clearInterval(countdownTimer);
      set({
        isBroadcasting: false,
        activeSession: null,
        currentPayload: null,
      });
    });
  },

  forceRotate: () => {
    const session = get().activeSession;
    if (!session) return;
    const socket = getAttendanceSocket();
    socket.emit('force_rotate', { sessionId: session.id });
    lastHeartbeatTimestamp = Date.now();
  },

  endLiveSession: async () => {
    const session = get().activeSession;
    if (session) {
      try {
        const socket = getAttendanceSocket();
        socket.emit('end_session', { sessionId: session.id });
        await api.post('/attendance/session/end', { sessionId: session.id });
      } catch (err) {
        console.warn('[endLiveSession error]', err);
      }
    }

    if (countdownTimer) clearInterval(countdownTimer);
    set({
      activeSession: null,
      isBroadcasting: false,
      currentPayload: null,
    });
  },

  checkActiveSession: async () => {
    try {
      const response = await api.get('/attendance/session/active');
      if (response.data.success && response.data.active && response.data.session) {
        const session = response.data.session;
        set({
          activeSession: session,
          isBroadcasting: true,
        });
        get().joinSessionRoom(session.id);
        get().fetchLiveRoster(session.id);
      }
    } catch (err) {
      // Ignore if unauthenticated or no active session
    }
  },

  verifyScannedPayload: async (qrData: string | object, biometricMeta) => {
    set({ isVerifying: true });
    try {
      let payload: any = {};

      if (typeof qrData === 'string') {
        try {
          if (qrData.startsWith('{')) {
            payload = JSON.parse(qrData);
          } else {
            payload = JSON.parse(atob(qrData));
          }
        } catch {
          payload = { token: qrData };
        }
      } else {
        payload = qrData;
      }

      const response = await api.post('/attendance/verify-qr', {
        sessionId: payload.sessionId || payload.s,
        token: payload.token,
        timestamp: payload.timestamp || payload.t,
        nonce: payload.nonce || payload.n,
        signature: payload.signature || payload.sig,
        biometricMatched: biometricMeta?.biometricMatched !== undefined ? biometricMeta.biometricMatched : true,
        similarityScore: biometricMeta?.similarityScore || 0.96,
        liveFaceDescriptor: biometricMeta?.liveFaceDescriptor,
        isFallback: biometricMeta?.isFallback || false,
      });

      if (response.data.success) {
        if (get().soundEnabled) {
          playSuccessChime();
        }

        const result = {
          success: true,
          message: response.data.message || 'Attendance verified successfully',
          record: response.data.record,
          latencyMs: response.data.record?.latencyMs || 24,
        };

        set({
          lastScanResult: result,
          isVerifying: false,
        });

        return result;
      }

      // Rejection
      if (get().soundEnabled) {
        playErrorBuzzer();
      }

      const errResult = {
        success: false,
        message: response.data.message || 'Verification rejected',
        errorCode: response.data.code,
      };

      set({
        lastScanResult: errResult,
        isVerifying: false,
      });

      return errResult;
    } catch (error: any) {
      if (get().soundEnabled) {
        playErrorBuzzer();
      }

      const errResult = {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Verification failed. Replay or expired token.',
        errorCode: error.response?.data?.code || 'VERIFICATION_ERROR',
      };

      set({
        lastScanResult: errResult,
        isVerifying: false,
      });

      return errResult;
    }
  },
}));
