import * as faceapi from '@vladmandic/face-api';

export type LivenessChallengeType =
  | 'BLINK_TWICE'
  | 'TURN_HEAD_LEFT'
  | 'TURN_HEAD_RIGHT'
  | 'SMILE';

export interface Point {
  x: number;
  y: number;
}

export interface LivenessMetrics {
  leftEAR: number;
  rightEAR: number;
  avgEAR: number;
  isBlinking: boolean;
  blinkCount: number;
  yawRatio: number; // Negative = turned left, Positive = turned right (-1 to 1)
  pitchRatio: number; // Negative = looking down, Positive = looking up
  mouthAspectRatio: number;
  smileScore: number;
  headPose: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
}

export interface LivenessChallengeState {
  challenge: LivenessChallengeType;
  title: string;
  instruction: string;
  targetCount: number;
  currentCount: number;
  progressPercent: number; // 0 to 100
  isCompleted: boolean;
  startTime: number;
  timeRemainingSeconds: number;
  timeLimitSeconds: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'TIMED_OUT';
  message: string;
}

/**
 * Euclidean distance between two 2D points
 */
function dist(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Eye Aspect Ratio (EAR) for a 6-point eye landmark set
 * Points: [p0: outer corner, p1: top-left, p2: top-right, p3: inner corner, p4: bottom-right, p5: bottom-left]
 */
export function calculateEyeAspectRatio(eyePoints: Point[]): number {
  if (!eyePoints || eyePoints.length < 6) return 0.3;

  const vertical1 = dist(eyePoints[1], eyePoints[5]);
  const vertical2 = dist(eyePoints[2], eyePoints[4]);
  const horizontal = dist(eyePoints[0], eyePoints[3]);

  if (horizontal === 0) return 0.3;

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Calculate Mouth Aspect Ratio (MAR) from inner lip landmarks
 */
export function calculateMouthAspectRatio(mouthPoints: Point[]): number {
  if (!mouthPoints || mouthPoints.length < 8) return 0.1;

  // Inner lips top vs bottom and left vs right
  // Inner lips in 68-landmark model are indices 60 to 67
  const v1 = dist(mouthPoints[1], mouthPoints[7]);
  const v2 = dist(mouthPoints[2], mouthPoints[6]);
  const v3 = dist(mouthPoints[3], mouthPoints[5]);
  const horizontal = dist(mouthPoints[0], mouthPoints[4]);

  if (horizontal === 0) return 0.1;

  return (v1 + v2 + v3) / (3.0 * horizontal);
}

/**
 * Extract facial metrics from 68 landmarks:
 * Left Eye: 36..41
 * Right Eye: 42..47
 * Nose: 27..35 (nose tip is 30)
 * Jaw: 0..16
 * Mouth: 48..67
 */
export function extractLivenessMetrics(
  landmarks: faceapi.FaceLandmarks68,
  expressions?: faceapi.FaceExpressions,
  prevBlinkState?: { isEyesClosed: boolean; blinkCount: number }
): LivenessMetrics {
  const positions = landmarks.positions;

  // Extract Eye Points
  const leftEyePoints = positions.slice(36, 42).map((p) => ({ x: p.x, y: p.y }));
  const rightEyePoints = positions.slice(42, 48).map((p) => ({ x: p.x, y: p.y }));

  const leftEAR = calculateEyeAspectRatio(leftEyePoints);
  const rightEAR = calculateEyeAspectRatio(rightEyePoints);
  const avgEAR = (leftEAR + rightEAR) / 2.0;

  // Blink state machine: Adaptive EAR threshold
  const EAR_CLOSED_THRESHOLD = 0.245;
  const EAR_OPEN_THRESHOLD = 0.265;
  const isEyesClosedNow = avgEAR < EAR_CLOSED_THRESHOLD;

  let blinkCount = prevBlinkState?.blinkCount || 0;
  let isCurrentlyBlinking = prevBlinkState?.isEyesClosed || false;

  if (isEyesClosedNow && !prevBlinkState?.isEyesClosed) {
    // Transition from Open -> Closed
    isCurrentlyBlinking = true;
  } else if (!isEyesClosedNow && avgEAR >= EAR_OPEN_THRESHOLD && prevBlinkState?.isEyesClosed) {
    // Transition from Closed -> Open (A complete blink cycle)
    isCurrentlyBlinking = false;
    blinkCount += 1;
  }

  // Head Pose (Yaw / Pitch) calculation
  const noseTip = positions[30];
  const leftJaw = positions[0];
  const rightJaw = positions[16];
  const leftEyeOuter = positions[36];
  const rightEyeOuter = positions[45];
  const noseBridge = positions[27];
  const chin = positions[8];

  // Yaw: Relative horizontal position of nose tip between left & right eye/jaw
  const distLeft = dist(noseTip, leftJaw) + dist(noseTip, leftEyeOuter);
  const distRight = dist(noseTip, rightJaw) + dist(noseTip, rightEyeOuter);
  const totalHoriz = distLeft + distRight;
  const yawRatio = totalHoriz > 0 ? (distLeft - distRight) / totalHoriz : 0;

  // Pitch: Relative vertical position of nose tip between bridge & chin
  const distTop = dist(noseTip, noseBridge);
  const distBottom = dist(noseTip, chin);
  const totalVert = distTop + distBottom;
  const pitchRatio = totalVert > 0 ? (distTop - distBottom) / totalVert : 0;

  let headPose: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' = 'CENTER';
  if (yawRatio < -0.10) headPose = 'LEFT';
  else if (yawRatio > 0.10) headPose = 'RIGHT';
  else if (pitchRatio < -0.25) headPose = 'UP';
  else if (pitchRatio > 0.15) headPose = 'DOWN';

  // Smile / Expression detection
  const smileScore = expressions ? (expressions.happy || 0) : 0;
  const innerMouthPoints = positions.slice(60, 68).map((p) => ({ x: p.x, y: p.y }));
  const mouthAspectRatio = calculateMouthAspectRatio(innerMouthPoints);

  return {
    leftEAR: Number(leftEAR.toFixed(3)),
    rightEAR: Number(rightEAR.toFixed(3)),
    avgEAR: Number(avgEAR.toFixed(3)),
    isBlinking: isCurrentlyBlinking,
    blinkCount,
    yawRatio: Number(yawRatio.toFixed(3)),
    pitchRatio: Number(pitchRatio.toFixed(3)),
    mouthAspectRatio: Number(mouthAspectRatio.toFixed(3)),
    smileScore: Number(smileScore.toFixed(3)),
    headPose,
  };
}

/**
 * Challenge Definitions
 */
export const CHALLENGE_CONFIG: Record<
  LivenessChallengeType,
  { title: string; instruction: string; targetCount: number; timeLimitSeconds: number }
> = {
  BLINK_TWICE: {
    title: 'Blink Challenge',
    instruction: 'Please blink your eyes naturally (1-2 times)',
    targetCount: 1, // Single clear blink is sufficient & snappy
    timeLimitSeconds: 25,
  },
  TURN_HEAD_LEFT: {
    title: 'Head Turn Challenge',
    instruction: 'Turn your head slightly to the left, then back',
    targetCount: 1,
    timeLimitSeconds: 25,
  },
  TURN_HEAD_RIGHT: {
    title: 'Head Turn Challenge',
    instruction: 'Turn your head slightly to the right, then back',
    targetCount: 1,
    timeLimitSeconds: 25,
  },
  SMILE: {
    title: 'Expression Challenge',
    instruction: 'Please give a natural smile to the camera',
    targetCount: 1,
    timeLimitSeconds: 25,
  },
};

/**
 * Pick a random anti-spoof challenge
 */
export function getRandomChallenge(): LivenessChallengeType {
  const challenges: LivenessChallengeType[] = [
    'BLINK_TWICE',
    'TURN_HEAD_LEFT',
    'TURN_HEAD_RIGHT',
    'SMILE',
  ];
  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Controller class to manage an active liveness challenge session
 */
export class LivenessEngine {
  private challenge: LivenessChallengeType;
  private startTime: number;
  private timeLimitSeconds: number;
  private currentCount: number = 0;
  private targetCount: number;
  private hasTurnedAway: boolean = false;
  private status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'TIMED_OUT' = 'IN_PROGRESS';
  private message: string = '';
  private blinkState = { isEyesClosed: false, blinkCount: 0 };
  private initialBlinkCount: number = 0;
  private earHistory: number[] = [];

  constructor(challengeType?: LivenessChallengeType) {
    this.challenge = challengeType || getRandomChallenge();
    const config = CHALLENGE_CONFIG[this.challenge];
    this.targetCount = config.targetCount;
    this.timeLimitSeconds = config.timeLimitSeconds;
    this.startTime = Date.now();
    this.message = config.instruction;
  }

  public reset(challengeType?: LivenessChallengeType): void {
    this.challenge = challengeType || getRandomChallenge();
    const config = CHALLENGE_CONFIG[this.challenge];
    this.targetCount = config.targetCount;
    this.timeLimitSeconds = config.timeLimitSeconds;
    this.startTime = Date.now();
    this.currentCount = 0;
    this.hasTurnedAway = false;
    this.status = 'IN_PROGRESS';
    this.message = config.instruction;
    this.blinkState = { isEyesClosed: false, blinkCount: 0 };
    this.initialBlinkCount = 0;
    this.earHistory = [];
  }

  /**
   * Process a frame's landmarks and update challenge state
   */
  public update(
    landmarks: faceapi.FaceLandmarks68,
    expressions?: faceapi.FaceExpressions
  ): {
    metrics: LivenessMetrics;
    state: LivenessChallengeState;
  } {
    const metrics = extractLivenessMetrics(landmarks, expressions, this.blinkState);
    this.blinkState = {
      isEyesClosed: metrics.isBlinking,
      blinkCount: metrics.blinkCount,
    };

    // Track EAR micro-movements for static photo anti-spoof
    this.earHistory.push(metrics.avgEAR);
    if (this.earHistory.length > 50) this.earHistory.shift();

    const elapsedMs = Date.now() - this.startTime;
    const elapsedSeconds = elapsedMs / 1000;
    const timeRemainingSeconds = Math.max(
      0,
      Math.ceil(this.timeLimitSeconds - elapsedSeconds)
    );

    if (this.status === 'IN_PROGRESS') {
      // 1. Time out check
      if (elapsedSeconds >= this.timeLimitSeconds) {
        this.status = 'TIMED_OUT';
        this.message = 'Liveness challenge timed out. Please try again.';
      } else {
        // 2. Challenge specific progress check
        switch (this.challenge) {
          case 'BLINK_TWICE': {
            this.currentCount = metrics.blinkCount;
            this.message =
              this.currentCount >= 1
                ? 'Blink detected! Verifying...'
                : 'Blink your eyes naturally...';

            if (this.currentCount >= this.targetCount) {
              this.status = 'PASSED';
              this.message = 'Blink liveness verified!';
            }
            break;
          }

          case 'TURN_HEAD_LEFT': {
            if (metrics.yawRatio < -0.09) {
              this.hasTurnedAway = true;
              this.message = 'Left turn detected! Now return to center...';
            }
            if (this.hasTurnedAway && Math.abs(metrics.yawRatio) <= 0.10) {
              this.currentCount = 1;
              this.status = 'PASSED';
              this.message = 'Head turn verified!';
            }
            break;
          }

          case 'TURN_HEAD_RIGHT': {
            if (metrics.yawRatio > 0.09) {
              this.hasTurnedAway = true;
              this.message = 'Right turn detected! Now return to center...';
            }
            if (this.hasTurnedAway && Math.abs(metrics.yawRatio) <= 0.10) {
              this.currentCount = 1;
              this.status = 'PASSED';
              this.message = 'Head turn verified!';
            }
            break;
          }

          case 'SMILE': {
            if (metrics.smileScore > 0.35 || metrics.mouthAspectRatio > 0.22) {
              this.currentCount = 1;
              this.status = 'PASSED';
              this.message = 'Natural smile verified!';
            }
            break;
          }
        }
      }
    }

    const progressPercent = Math.min(
      100,
      Math.round((this.currentCount / this.targetCount) * 100)
    );

    const config = CHALLENGE_CONFIG[this.challenge];

    const state: LivenessChallengeState = {
      challenge: this.challenge,
      title: config.title,
      instruction: config.instruction,
      targetCount: this.targetCount,
      currentCount: this.currentCount,
      progressPercent: this.status === 'PASSED' ? 100 : progressPercent,
      isCompleted: this.status === 'PASSED',
      startTime: this.startTime,
      timeRemainingSeconds,
      timeLimitSeconds: this.timeLimitSeconds,
      status: this.status,
      message: this.message,
    };

    return { metrics, state };
  }
}
