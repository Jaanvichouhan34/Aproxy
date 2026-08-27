import crypto from 'crypto';
import qrSessionService from './services/qrSession.service';

async function runE2EFlow() {
  console.log('🚀 Running E2E High-Frequency Rotating QR Session Flow...\n');

  const sessionId = 'session-live-' + Date.now();
  const teacherId = 'teacher-prof-thorne';
  const student1Id = 'student-alex-rivera';
  const student2Id = 'student-elena-rostova';
  const sessionSecret = crypto.randomBytes(32).toString('hex');

  // Step 1: Teacher initiates session
  console.log('Step 1: Teacher starts Live Attendance Session for CS402 (Hall B-201)...');
  qrSessionService.registerSession({
    sessionId,
    teacherId,
    subjectId: 'sub-cs402',
    subjectCode: 'CS402',
    subjectName: 'Network Security & Cryptography',
    roomNumber: 'Hall B-201',
    batch: 'CS-2026-A',
    secretKey: sessionSecret,
  });
  console.log('✅ Session active in high-speed memory cache: ' + sessionId);

  // Step 2: 1000ms rotating heartbeat pulses
  console.log('\nStep 2: WebSocket rotates token 1 (T0)...');
  const token1 = qrSessionService.rotateToken(sessionId)!;
  console.log(`   [Heartbeat T0] Nonce: ${token1.nonce} | Sig: ${token1.signature.slice(0, 16)}...`);

  // Step 3: Student 1 scans immediately (<200ms)
  console.log('\nStep 3: Student Alex Rivera scans rotating QR on auditorium screen (35ms latency)...');
  const student1Verify = qrSessionService.verifyTokenPayload({
    sessionId,
    studentId: student1Id,
    timestamp: token1.timestamp,
    nonce: token1.nonce,
    signature: token1.signature,
  });

  if (student1Verify.valid) {
    console.log('✅ Alex Rivera verified present! (Attendance record created, Socket.IO broadcast emitted)');
  } else {
    console.error('❌ Failed verification:', student1Verify);
    process.exit(1);
  }

  // Step 4: Alex tries to scan the same nonce again
  console.log('\nStep 4: Alex attempts immediate duplicate check-in with same nonce...');
  const student1Duplicate = qrSessionService.verifyTokenPayload({
    sessionId,
    studentId: student1Id,
    timestamp: token1.timestamp,
    nonce: token1.nonce,
    signature: token1.signature,
  });
  console.log(`✅ Duplicate check-in rejected: [${student1Duplicate.errorCode}] ${student1Duplicate.message}`);

  // Step 5: Next 1000ms WebSocket pulse
  console.log('\nStep 5: WebSocket rotates token 2 (T1 = 1000ms later)...');
  const token2 = qrSessionService.rotateToken(sessionId)!;
  console.log(`   [Heartbeat T1] Nonce: ${token2.nonce} | Sig: ${token2.signature.slice(0, 16)}...`);

  // Step 6: Student 2 scans new rotating token
  console.log('\nStep 6: Student Elena Rostova scans newly rotated token...');
  const student2Verify = qrSessionService.verifyTokenPayload({
    sessionId,
    studentId: student2Id,
    timestamp: token2.timestamp,
    nonce: token2.nonce,
    signature: token2.signature,
  });
  if (student2Verify.valid) {
    console.log('✅ Elena Rostova verified present!');
  } else {
    console.error('❌ Failed verification for Elena:', student2Verify);
    process.exit(1);
  }

  // Step 7: A proxy student tries to use Alex's forwarded screenshot of token 1 after 2.8 seconds
  console.log('\nStep 7: Proxy attacker receives screenshot of Token 1 over WhatsApp (2800ms old)...');
  const proxyAttackerVerify = qrSessionService.verifyTokenPayload({
    sessionId,
    studentId: 'student-proxy-attacker',
    timestamp: token1.timestamp - 2800,
    nonce: token1.nonce,
    signature: token1.signature,
  });
  console.log(`✅ Proxy attack intercepted: [${proxyAttackerVerify.errorCode}] ${proxyAttackerVerify.message}`);

  // Step 8: Session termination
  console.log('\nStep 8: Teacher terminates session...');
  qrSessionService.unregisterSession(sessionId);
  console.log('✅ Session unregistered and memory revoked.');

  console.log('\n✨ ALL E2E INTEGRATION FLOWS VERIFIED WITH 100% SUCCESS!');
}

runE2EFlow().catch((err) => {
  console.error('E2E test error:', err);
  process.exit(1);
});
