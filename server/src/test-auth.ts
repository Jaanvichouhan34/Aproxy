import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './utils/jwt';
import { registerSchema, loginSchema } from './schemas/auth.schema';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('--- Starting Aproxy Phase 2 Automated Tests ---');

  // Test 1: JWT Access & Refresh Token generation and verification
  console.log('[Test 1] Testing JWT Access & Refresh Token Creation/Verification...');
  const sampleUser = {
    userId: 'user_1234567890',
    email: 'test.teacher@university.edu',
    role: 'teacher' as const,
    name: 'Prof. Test Thorne',
  };

  const accessToken = generateAccessToken(sampleUser);
  const refreshToken = generateRefreshToken({ userId: sampleUser.userId });

  const verifiedAccess = verifyAccessToken(accessToken);
  if (verifiedAccess.userId === sampleUser.userId && verifiedAccess.role === 'teacher') {
    console.log('  ✓ Access Token generation and verification passed');
  } else {
    throw new Error('Access Token verification failed');
  }

  const verifiedRefresh = verifyRefreshToken(refreshToken);
  if (verifiedRefresh.userId === sampleUser.userId) {
    console.log('  ✓ Refresh Token generation and verification passed');
  } else {
    throw new Error('Refresh Token verification failed');
  }

  // Test 2: Password hashing with bcrypt
  console.log('[Test 2] Testing Bcrypt Password Hashing & Comparison...');
  const rawPassword = 'SecurePassword@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);
  const isMatch = await bcrypt.compare(rawPassword, hash);
  const isWrong = await bcrypt.compare('WrongPassword', hash);

  if (isMatch && !isWrong) {
    console.log('  ✓ Bcrypt password hashing and validation passed');
  } else {
    throw new Error('Bcrypt validation failed');
  }

  // Test 3: Zod Schema Validation
  console.log('[Test 3] Testing Zod Validation Schemas...');

  // Student register without enrollmentNumber should fail
  const invalidStudent = {
    name: 'Alex Rivera',
    email: 'alex@univ.edu',
    password: 'Password123',
    role: 'student',
  };
  const resInvalid = registerSchema.safeParse(invalidStudent);
  if (!resInvalid.success) {
    console.log('  ✓ Zod correctly rejected student without enrollment number');
  } else {
    throw new Error('Zod failed to enforce student enrollment number');
  }

  // Student register with valid enrollmentNumber should pass
  const validStudent = {
    name: 'Alex Rivera',
    email: 'alex@univ.edu',
    password: 'Password123',
    role: 'student',
    enrollmentNumber: '2024-CS-089',
    department: 'Computer Science',
  };
  const resValid = registerSchema.safeParse(validStudent);
  if (resValid.success) {
    console.log('  ✓ Zod correctly validated complete student registration payload');
  } else {
    throw new Error('Zod failed valid student payload');
  }

  // Teacher register without enrollmentNumber should pass
  const validTeacher = {
    name: 'Prof. Marcus Thorne',
    email: 'thorne@univ.edu',
    password: 'Password123',
    role: 'teacher',
    department: 'Cybersecurity',
  };
  const resTeacher = registerSchema.safeParse(validTeacher);
  if (resTeacher.success) {
    console.log('  ✓ Zod correctly validated teacher registration payload');
  } else {
    throw new Error('Zod failed valid teacher payload');
  }

  // Login schema test
  const validLogin = loginSchema.safeParse({
    email: 'student@univ.edu',
    password: 'Password123',
  });
  if (validLogin.success) {
    console.log('  ✓ Zod correctly validated login payload');
  } else {
    throw new Error('Zod login validation failed');
  }

  console.log('==============================================');
  console.log('🎉 ALL PHASE 2 CORE AUTH & RBAC TESTS PASSED!');
  console.log('==============================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
