import crypto from 'crypto';

export interface DynamicQRPayload {
  sessionId: string;
  token: string;
  timestamp: number;
  nonce: string;
  signature: string;
  validityMs: number;
}

export interface VerificationResult {
  valid: boolean;
  errorCode?: 'INVALID_SESSION' | 'INVALID_SIGNATURE' | 'TOKEN_EXPIRED' | 'NONCE_REPLAY' | 'FUTURE_TIMESTAMP';
  message?: string;
  sessionDetails?: {
    sessionId: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    roomNumber: string;
    batch: string;
  };
}

export interface ActiveSessionState {
  sessionId: string;
  teacherId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  roomNumber: string;
  batch: string;
  secretKey: string;
  currentNonce: string;
  currentTimestamp: number;
  currentSignature: string;
  recentNonces: Map<string, number>; // nonce -> generatedTimestamp
  usedNonces: Set<string>; // Set of "studentId:nonce" or "nonce"
}

class QRSessionService {
  // In-memory active session lookup for sub-millisecond cryptographic verification
  private activeSessions: Map<string, ActiveSessionState> = new Map();

  // Maximum allowed timestamp drift window in milliseconds (1s rotation + 1s network drift)
  private readonly MAX_DRIFT_MS = 2000;
  // Maximum future clock skew allowance (1000ms)
  private readonly MAX_FUTURE_SKEW_MS = 1000;

  constructor() {
    // Periodic garbage collection for expired nonces and stale memory (runs every 60 seconds)
    setInterval(() => this.cleanupExpiredNonces(), 60000);
  }

  /**
   * Register a new or reopened active session in the fast in-memory engine
   */
  public registerSession(session: {
    sessionId: string;
    teacherId: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    roomNumber: string;
    batch: string;
    secretKey: string;
  }): ActiveSessionState {
    const sessionState: ActiveSessionState = {
      sessionId: session.sessionId,
      teacherId: session.teacherId,
      subjectId: session.subjectId,
      subjectCode: session.subjectCode,
      subjectName: session.subjectName,
      roomNumber: session.roomNumber,
      batch: session.batch,
      secretKey: session.secretKey,
      currentNonce: this.generateRandomNonce(),
      currentTimestamp: Date.now(),
      currentSignature: '',
      recentNonces: new Map(),
      usedNonces: new Set(),
    };

    // Sign initial token
    sessionState.currentSignature = this.computeSignature(
      sessionState.sessionId,
      sessionState.currentTimestamp,
      sessionState.currentNonce,
      sessionState.secretKey
    );
    sessionState.recentNonces.set(sessionState.currentNonce, sessionState.currentTimestamp);

    this.activeSessions.set(session.sessionId, sessionState);
    return sessionState;
  }

  /**
   * Check if a session is currently active in-memory
   */
  public getSessionState(sessionId: string): ActiveSessionState | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Remove a terminated session from active memory
   */
  public unregisterSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Generate a cryptographically secure 12-character hex nonce with 0x prefix
   */
  public generateRandomNonce(): string {
    return '0x' + crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Compute HMAC-SHA256 signature for a token payload
   */
  public computeSignature(
    sessionId: string,
    timestamp: number,
    nonce: string,
    secretKey: string
  ): string {
    const message = `${sessionId}:${timestamp}:${nonce}`;
    return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  }

  /**
   * Rotate the token for an active session (called on every 1000ms WebSocket heartbeat)
   */
  public rotateToken(sessionId: string): DynamicQRPayload | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const timestamp = Date.now();
    const nonce = this.generateRandomNonce();
    const signature = this.computeSignature(sessionId, timestamp, nonce, session.secretKey);

    session.currentNonce = nonce;
    session.currentTimestamp = timestamp;
    session.currentSignature = signature;

    // Track recently valid nonces with timestamp
    session.recentNonces.set(nonce, timestamp);

    // Build raw compact token payload
    const tokenObj = {
      s: sessionId,
      t: timestamp,
      n: nonce,
      sig: signature,
    };
    const token = Buffer.from(JSON.stringify(tokenObj)).toString('base64url');

    return {
      sessionId,
      token,
      timestamp,
      nonce,
      signature,
      validityMs: this.MAX_DRIFT_MS,
    };
  }

  /**
   * Verify an incoming QR scan payload against cryptographic & replay constraints
   */
  public verifyTokenPayload(params: {
    sessionId: string;
    studentId: string;
    timestamp: number;
    nonce: string;
    signature: string;
    fallbackSecretKey?: string;
  }): VerificationResult {
    const { sessionId, studentId, timestamp, nonce, signature, fallbackSecretKey } = params;
    const now = Date.now();

    const session = this.activeSessions.get(sessionId);
    const secretKey = session?.secretKey || fallbackSecretKey;

    if (!session && !secretKey) {
      return {
        valid: false,
        errorCode: 'INVALID_SESSION',
        message: 'Attendance session is not currently active or was closed.',
      };
    }

    // 1. Timestamp Drift Validation (< 2000ms)
    const timeDelta = now - timestamp;

    if (timeDelta < -this.MAX_FUTURE_SKEW_MS) {
      return {
        valid: false,
        errorCode: 'FUTURE_TIMESTAMP',
        message: 'Clock skew error: Token timestamp is ahead of server time.',
      };
    }

    if (timeDelta > this.MAX_DRIFT_MS) {
      return {
        valid: false,
        errorCode: 'TOKEN_EXPIRED',
        message: `Token expired (${Math.round(timeDelta)}ms old). Must be scanned within ${this.MAX_DRIFT_MS}ms. Screenshot forwarding prevented.`,
      };
    }

    // 2. Cryptographic HMAC-SHA256 Signature Verification
    const expectedSignature = this.computeSignature(sessionId, timestamp, nonce, secretKey!);
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return {
        valid: false,
        errorCode: 'INVALID_SIGNATURE',
        message: 'Invalid cryptographic signature. Tampered or forged QR payload.',
      };
    }

    // 3. Anti-Replay Nonce Verification (per student and per session)
    if (session) {
      const studentNonceKey = `${studentId}:${nonce}`;
      if (session.usedNonces.has(studentNonceKey)) {
        return {
          valid: false,
          errorCode: 'NONCE_REPLAY',
          message: 'Anti-replay alert: This rotating nonce has already been used by this student.',
        };
      }

      // Mark nonce as consumed
      session.usedNonces.add(studentNonceKey);
    }

    return {
      valid: true,
      sessionDetails: session
        ? {
            sessionId: session.sessionId,
            subjectId: session.subjectId,
            subjectCode: session.subjectCode,
            subjectName: session.subjectName,
            roomNumber: session.roomNumber,
            batch: session.batch,
          }
        : undefined,
    };
  }

  /**
   * Cleanup stale nonces older than 30 seconds to prevent unbounded memory growth
   */
  private cleanupExpiredNonces(): void {
    const threshold = Date.now() - 30000;
    for (const session of this.activeSessions.values()) {
      for (const [nonce, ts] of session.recentNonces.entries()) {
        if (ts < threshold) {
          session.recentNonces.delete(nonce);
        }
      }
      // Note: usedNonces set naturally stays bounded per session lifespan
    }
  }
}

export const qrSessionService = new QRSessionService();
export default qrSessionService;
