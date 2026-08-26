import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

// Primary local path with fallback CDN
const LOCAL_MODEL_URL = '/models';
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

/**
 * Load face-api neural network models (TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet)
 */
export async function loadBiometricModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      // First try loading from local public /models
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(LOCAL_MODEL_URL),
        ]);
        modelsLoaded = true;
        return true;
      } catch (localErr) {
        console.warn('[FaceAPI] Local models failed to load, falling back to CDN...', localErr);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(CDN_MODEL_URL),
        ]);
        modelsLoaded = true;
        return true;
      }
    } catch (error) {
      console.error('[FaceAPI] Critical error loading models:', error);
      modelsLoaded = false;
      modelLoadingPromise = null;
      return false;
    }
  })();

  return modelLoadingPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Options for TinyFaceDetector
 */
export const getDetectorOptions = (inputSize: number = 320, scoreThreshold: number = 0.5) => {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold,
  });
};

export interface FaceDetectionResult {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  descriptor: Float32Array;
  expressions?: faceapi.FaceExpressions;
}

/**
 * Detect a single face with landmarks, 128D descriptor, and expressions
 */
export async function detectSingleFaceWithDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<FaceDetectionResult | null> {
  if (!modelsLoaded) {
    const ok = await loadBiometricModels();
    if (!ok) return null;
  }

  try {
    const result = await faceapi
      .detectSingleFace(input, getDetectorOptions(320, 0.5))
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptor();

    if (!result) return null;

    return {
      detection: result.detection,
      landmarks: result.landmarks,
      descriptor: result.descriptor,
      expressions: result.expressions,
    };
  } catch (err) {
    console.warn('[FaceAPI] Detection error:', err);
    return null;
  }
}

/**
 * Detect all faces in frame to ensure single-person presence
 */
export async function detectAllFacesInFrame(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<faceapi.FaceDetection[]> {
  if (!modelsLoaded) {
    const ok = await loadBiometricModels();
    if (!ok) return [];
  }

  try {
    return await faceapi.detectAllFaces(input, getDetectorOptions(320, 0.4));
  } catch {
    return [];
  }
}

export interface QualityCheckResult {
  isValid: boolean;
  isCentered: boolean;
  isLightingGood: boolean;
  brightness: number; // 0 to 255
  isSizeGood: boolean;
  faceCount: number;
  issues: string[];
}

/**
 * Check face framing, centering, lighting quality, and single-person constraints
 */
export function checkFaceQuality(
  video: HTMLVideoElement,
  detection: faceapi.FaceDetection | null,
  allFacesCount: number = 1
): QualityCheckResult {
  const issues: string[] = [];

  if (!detection || allFacesCount === 0) {
    return {
      isValid: false,
      isCentered: false,
      isLightingGood: false,
      brightness: 0,
      isSizeGood: false,
      faceCount: 0,
      issues: ['No face detected in camera feed'],
    };
  }

  if (allFacesCount > 1) {
    issues.push(`Multiple people detected (${allFacesCount}). Ensure only you are in frame.`);
  }

  const box = detection.box;
  const videoWidth = video.videoWidth || video.width || 640;
  const videoHeight = video.videoHeight || video.height || 480;

  // 1. Centering Check (Center point should be close to viewport center)
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;
  const frameCenterX = videoWidth / 2;
  const frameCenterY = videoHeight / 2;

  const maxOffsetX = videoWidth * 0.22;
  const maxOffsetY = videoHeight * 0.22;
  const isCentered =
    Math.abs(faceCenterX - frameCenterX) <= maxOffsetX &&
    Math.abs(faceCenterY - frameCenterY) <= maxOffsetY;

  if (!isCentered) {
    issues.push('Center your face in the oval guide');
  }

  // 2. Size Check (Face width should occupy between 25% and 75% of frame)
  const faceRatio = box.width / videoWidth;
  const isSizeGood = faceRatio >= 0.22 && faceRatio <= 0.78;
  if (faceRatio < 0.22) {
    issues.push('Move closer to the camera');
  } else if (faceRatio > 0.78) {
    issues.push('Move slightly further from the camera');
  }

  // 3. Lighting Check (Sample pixels inside face bounding box)
  let brightness = 128;
  let isLightingGood = true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(box.width));
    canvas.height = Math.max(1, Math.floor(box.height));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(
        video,
        Math.max(0, box.x),
        Math.max(0, box.y),
        Math.max(1, box.width),
        Math.max(1, box.height),
        0,
        0,
        canvas.width,
        canvas.height
      );
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let totalLuminance = 0;
      const step = 4 * 4; // Sample every 4th pixel for speed
      let samples = 0;
      for (let i = 0; i < data.length; i += step) {
        // ITU-R BT.601 formula for relative luminance
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
        samples++;
      }
      brightness = samples > 0 ? Math.round(totalLuminance / samples) : 128;

      if (brightness < 45) {
        isLightingGood = false;
        issues.push('Lighting is too dark. Increase ambient light.');
      } else if (brightness > 230) {
        isLightingGood = false;
        issues.push('Lighting is overexposed. Avoid direct glare.');
      }
    }
  } catch {
    brightness = 128;
    isLightingGood = true;
  }

  const isValid = issues.length === 0;

  return {
    isValid,
    isCentered,
    isLightingGood,
    brightness,
    isSizeGood,
    faceCount: allFacesCount,
    issues,
  };
}

/**
 * Compute Euclidean distance between two 128D float vectors:
 * d = sqrt(sum((a_i - b_i)^2))
 * Standard Face-API threshold: < 0.45 is a strict match, < 0.50 is moderate
 */
export function euclideanDistance(
  vec1: Float32Array | number[],
  vec2: Float32Array | number[]
): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
    return 1.0;
  }

  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Compute Cosine Similarity between two 128D vectors:
 * cos(theta) = (A . B) / (||A|| * ||B||)
 * Returns a value between -1.0 and 1.0 (typically 0.60 to 0.99 for same face)
 */
export function cosineSimilarity(
  vec1: Float32Array | number[],
  vec2: Float32Array | number[]
): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normA += vec1[i] * vec1[i];
    normB += vec2[i] * vec2[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Check if two descriptors match within acceptable biometric threshold
 */
export function isBiometricMatch(
  vec1: Float32Array | number[],
  vec2: Float32Array | number[],
  threshold: number = 0.45
): {
  isMatch: boolean;
  euclideanDistance: number;
  cosineSimilarity: number;
  similarityScorePercent: number;
} {
  const dist = euclideanDistance(vec1, vec2);
  const cosSim = cosineSimilarity(vec1, vec2);

  // Convert distance and cosine similarity into a readable 0-100% score
  // Typical match distance is 0.20-0.42 (cos ~ 0.85-0.98)
  const similarityScorePercent = Math.max(
    0,
    Math.min(100, Math.round((1 - Math.min(1, dist / 0.8)) * 100))
  );

  return {
    isMatch: dist <= threshold,
    euclideanDistance: Number(dist.toFixed(4)),
    cosineSimilarity: Number(cosSim.toFixed(4)),
    similarityScorePercent,
  };
}

/**
 * Compute the average of multiple 128D descriptors for multi-frame enrollment
 */
export function averageDescriptors(descriptors: Array<Float32Array | number[]>): number[] {
  if (descriptors.length === 0) return [];
  if (descriptors.length === 1) return Array.from(descriptors[0]);

  const length = descriptors[0].length;
  const avg = new Array(length).fill(0);

  for (const desc of descriptors) {
    for (let i = 0; i < length; i++) {
      avg[i] += desc[i];
    }
  }

  for (let i = 0; i < length; i++) {
    avg[i] /= descriptors.length;
  }

  // Normalize the averaged vector to unit length
  let norm = 0;
  for (let i = 0; i < length; i++) {
    norm += avg[i] * avg[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < length; i++) {
      avg[i] /= norm;
    }
  }

  return avg;
}
