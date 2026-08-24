import { io, Socket } from 'socket.io-client';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

let attendanceSocket: Socket | null = null;

export const getAttendanceSocket = (): Socket => {
  if (!attendanceSocket) {
    attendanceSocket = io(`${BACKEND_URL}/attendance-session`, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    attendanceSocket.on('connect', () => {
      console.log('[Socket.IO] Connected to /attendance-session namespace:', attendanceSocket?.id);
    });

    attendanceSocket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
    });

    attendanceSocket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected from /attendance-session namespace:', reason);
    });
  }

  return attendanceSocket;
};

export default getAttendanceSocket;
