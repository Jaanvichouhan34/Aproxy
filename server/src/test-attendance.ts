import qrSessionService from './services/qrSession.service';
import crypto from 'crypto';

async function runAttendanceCryptoTests() {
  console.log('🧪 Starting Cryptographic Attendance Engine Tests...\n');

  const testSessionId = 'session-test-' + Date.now();
  const testTeacherId = 'teacher-101';
  const testStudentId = 'student-202';
  const testSecretKey = crypto.randomBytes(32).toString('hex');

  // 1. Test Session Registration
  console.log('Test 1: Registering session in cryptographic memory engine...');
  const registered = qrSessionService.registerSession({
    sessionId: testSessionId,
    teacherId: testTeacherId,
    subjectId: 'sub-cs402',
    subjectCode: 'CS402',
    subjectName: 'Network Security',
    roomNumber: 'Hall B-201',
    batch: 'CS-2026-A',
    secretKey: testSecretKey,
  });

  if (registered && registered.sessionId === testSessionId) {
    console.log('✅ Session registered successfully with secret key and initial seed:', registered.currentNonce);
  } else {
    console.error('❌ Failed to register session');
    process.exit(1);
  }

  // 2. Test Token Rotation
  console.log('\nTest 2: Generating rotating token payload (1000ms heartbeat)...');
  const payload1 = qrSessionService.rotateToken(testSessionId);
  if (payload1 && payload1.nonce && payload1.signature) {
    console.log('✅ Generated rotating payload:');
    console.log('   Nonce:', payload1.nonce);
    console.log('   Timestamp:', payload1.timestamp);
    console.log('   Signature (HMAC-SHA256):', payload1.signature);
    console.log('   Validity Window:', payload1.validityMs, 'ms');
  } else {
    console.error('❌ Failed to generate rotating payload');
    process.exit(1);
  }

  // 3. Test Valid Token Verification (<2000ms window)
  console.log('\nTest 3: Verifying fresh token payload with valid student...');
  const verifyResult = qrSessionService.verifyTokenPayload({
    sessionId: testSessionId,
    studentId: testStudentId,
    timestamp: payload1!.timestamp,
    nonce: payload1!.nonce,
    signature: payload1!.signature,
  });

  if (verifyResult.valid) {
    console.log('✅ Fresh token cryptographically verified successfully!');
  } else {
    console.error('❌ Expected valid verification, got:', verifyResult);
    process.exit(1);
  }

  // 4. Test Anti-Replay Nonce Protection (Duplicate Nonce Check)
  console.log('\nTest 4: Attempting replay attack (re-submitting identical nonce)...');
  const replayResult = qrSessionService.verifyTokenPayload({
    sessionId: testSessionId,
    studentId: testStudentId,
    timestamp: payload1!.timestamp,
    nonce: payload1!.nonce,
    signature: payload1!.signature,
  });

  if (!replayResult.valid && replayResult.errorCode === 'NONCE_REPLAY') {
    console.log('✅ Anti-replay triggered correctly! Error:', replayResult.message);
  } else {
    console.error('❌ Expected NONCE_REPLAY rejection, got:', replayResult);
    process.exit(1);
  }

  // 5. Test Signature Tampering Prevention
  console.log('\nTest 5: Attempting verification with tampered HMAC signature...');
  const payload2 = qrSessionService.rotateToken(testSessionId);
  const tamperedSig = payload2!.signature.slice(0, -4) + 'abcd';
  const tamperResult = qrSessionService.verifyTokenPayload({
    sessionId: testSessionId,
    studentId: 'student-999',
    timestamp: payload2!.timestamp,
    nonce: payload2!.nonce,
    signature: tamperedSig,
  });

  if (!tamperResult.valid && tamperResult.errorCode === 'INVALID_SIGNATURE') {
    console.log('✅ Tampered signature rejected correctly! Error:', tamperResult.message);
  } else {
    console.error('❌ Expected INVALID_SIGNATURE rejection, got:', tamperResult);
    process.exit(1);
  }

  // 6. Test Expiration / Drift Cutoff (> 2000ms)
  console.log('\nTest 6: Attempting verification of expired screenshot (> 2000ms old)...');
  const expiredTimestamp = Date.now() - 3500; // 3.5 seconds old
  const expiredNonce = qrSessionService.generateRandomNonce();
  const expiredSignature = qrSessionService.computeSignature(
    testSessionId,
    expiredTimestamp,
    expiredNonce,
    testSecretKey
  );

  const expiredResult = qrSessionService.verifyTokenPayload({
    sessionId: testSessionId,
    studentId: 'student-303',
    timestamp: expiredTimestamp,
    nonce: expiredNonce,
    signature: expiredSignature,
  });

  if (!expiredResult.valid && expiredResult.errorCode === 'TOKEN_EXPIRED') {
    console.log('✅ Expired token/screenshot rejected correctly! Error:', expiredResult.message);
  } else {
    console.error('❌ Expected TOKEN_EXPIRED rejection, got:', expiredResult);
    process.exit(1);
  }

  // 7. Cleanup
  qrSessionService.unregisterSession(testSessionId);
  console.log('\n🎉 ALL CRYPTOGRAPHIC ATTENDANCE ENGINE TESTS PASSED PERFECTLY!\n');
}

runAttendanceCryptoTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
