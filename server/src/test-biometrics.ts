function euclideanDistance(vec1: number[], vec2: number[]): number {
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

function cosineSimilarity(vec1: number[], vec2: number[]): number {
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

function isBiometricMatch(vec1: number[], vec2: number[], threshold: number = 0.45) {
  const dist = euclideanDistance(vec1, vec2);
  const cosSim = cosineSimilarity(vec1, vec2);
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

function generateFaceVector(seed: number): number[] {
  const vec: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    const val = Math.sin((i + 1) * seed * 1.618) * 0.2 + Math.cos((i + 3) * seed * 0.8) * 0.15;
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq);
  return vec.map((v) => v / norm);
}

function runBiometricVerificationSuite() {
  console.log('====================================================');
  console.log('  APROXY BIOMETRIC VECTOR & LIVENESS TEST SUITE     ');
  console.log('====================================================\n');

  // 1. Generate Enrolled Vector for Student A
  const studentAEnrolled = generateFaceVector(42);
  console.log('1. Generated 128D Enrolled Template for Student A:');
  console.log(`   Dimensions: ${studentAEnrolled.length}`);
  console.log(`   Sample coordinates [0..4]: ${studentAEnrolled.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

  // 2. Generate Live Vector for Student A with slight natural variation (noise)
  const studentALive = studentAEnrolled.map((val) => val + (Math.random() - 0.5) * 0.05);
  let sumSq = 0;
  studentALive.forEach(v => sumSq += v * v);
  const normA = Math.sqrt(sumSq);
  const studentALiveNorm = studentALive.map(v => v / normA);

  const matchSelf = isBiometricMatch(studentAEnrolled, studentALiveNorm, 0.45);
  console.log('\n2. Testing Legitimate Student A Live Match:');
  console.log(`   Euclidean Distance: ${matchSelf.euclideanDistance} (Threshold < 0.45)`);
  console.log(`   Cosine Similarity: ${(matchSelf.cosineSimilarity * 100).toFixed(1)}%`);
  console.log(`   Result: ${matchSelf.isMatch ? 'PASSED (VERIFIED)' : 'FAILED'}`);

  if (!matchSelf.isMatch) {
    throw new Error('Self match failed!');
  }

  // 3. Generate Vector for Impostor / Proxy Student B
  const studentBImpostor = generateFaceVector(999);
  const matchImpostor = isBiometricMatch(studentAEnrolled, studentBImpostor, 0.45);
  console.log('\n3. Testing Impostor / Buddy-Punching Attempt (Student B):');
  console.log(`   Euclidean Distance: ${matchImpostor.euclideanDistance} (Threshold < 0.45)`);
  console.log(`   Cosine Similarity: ${(matchImpostor.cosineSimilarity * 100).toFixed(1)}%`);
  console.log(`   Result: ${!matchImpostor.isMatch ? 'REJECTED (SPOOF BLOCKED)' : 'FAILED TO BLOCK'}`);

  if (matchImpostor.isMatch) {
    throw new Error('Impostor match should have been rejected!');
  }

  // 4. Test Eye Aspect Ratio (EAR) Liveness Formula
  console.log('\n4. Testing Eye Aspect Ratio (EAR) Blink Detection:');
  const openEye = [
    { x: 10, y: 50 },
    { x: 20, y: 45 },
    { x: 30, y: 45 },
    { x: 40, y: 50 },
    { x: 30, y: 55 },
    { x: 20, y: 55 },
  ];
  const d = (p1: any, p2: any) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
  const openEAR = (d(openEye[1], openEye[5]) + d(openEye[2], openEye[4])) / (2 * d(openEye[0], openEye[3]));
  console.log(`   Open Eyes EAR: ${openEAR.toFixed(3)} (Standard > 0.28)`);

  const closedEye = [
    { x: 10, y: 50 },
    { x: 20, y: 49 },
    { x: 30, y: 49 },
    { x: 40, y: 50 },
    { x: 30, y: 51 },
    { x: 20, y: 51 },
  ];
  const closedEAR = (d(closedEye[1], closedEye[5]) + d(closedEye[2], closedEye[4])) / (2 * d(closedEye[0], closedEye[3]));
  console.log(`   Closed Eyes (Blink) EAR: ${closedEAR.toFixed(3)} (Standard < 0.22)`);

  if (openEAR < 0.28 || closedEAR > 0.22) {
    throw new Error('EAR blink threshold check failed!');
  }

  console.log('\n====================================================');
  console.log('  ALL BIOMETRIC & ANTI-SPOOF TESTS PASSED (100%)    ');
  console.log('====================================================\n');
}

runBiometricVerificationSuite();
