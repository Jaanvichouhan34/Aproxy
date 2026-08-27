import {
  createSubjectSchema,
  createScheduleSchema,
  updateScheduleSchema,
} from './schemas/timetable.schema';
import { doTimeRangesOverlap } from './services/conflict.service';

async function runTimetableTests() {
  console.log('====================================================');
  console.log('--- Starting Aproxy Phase 3 Timetable Engine Tests ---');
  console.log('====================================================');

  // Test 1: Subject Schema Validation
  console.log('\n[Test 1] Testing Subject Schema Validation...');

  const validSubject = {
    code: 'CS402',
    name: 'Network Security & Applied Cryptography',
    department: 'Computer Science & Engineering',
    colorTag: '#6366F1',
  };

  const resSubject = createSubjectSchema.safeParse(validSubject);
  if (!resSubject.success) {
    throw new Error(`Valid subject failed: ${JSON.stringify(resSubject.error.errors)}`);
  }
  console.log('  ✓ Valid subject parsed successfully');

  const invalidSubjectCode = {
    code: 'C', // Too short (min 2)
    name: 'Intro',
  };
  const resInvalidCode = createSubjectSchema.safeParse(invalidSubjectCode);
  if (resInvalidCode.success) {
    throw new Error('Invalid subject code should have failed validation');
  }
  console.log('  ✓ Short subject code rejected correctly');

  // Test 2: Schedule Schema Validation & Time Invariants
  console.log('\n[Test 2] Testing Schedule Schema & Time Invariants...');

  const validSchedule = {
    subjectId: '507f1f77bcf86cd799439011',
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '10:30',
    roomNumber: 'Hall B-201',
    batch: 'CS-2026-A',
    classType: 'Lecture',
  };

  const resSchedule = createScheduleSchema.safeParse(validSchedule);
  if (!resSchedule.success) {
    throw new Error(`Valid schedule failed: ${JSON.stringify(resSchedule.error.errors)}`);
  }
  console.log('  ✓ Valid class schedule slot parsed successfully');

  // End time before start time must fail
  const invalidTimeOrder = {
    subjectId: '507f1f77bcf86cd799439011',
    dayOfWeek: 1,
    startTime: '11:00',
    endTime: '09:30', // Earlier than start
    roomNumber: 'Hall B-201',
    batch: 'CS-2026-A',
  };
  const resTimeOrder = createScheduleSchema.safeParse(invalidTimeOrder);
  if (resTimeOrder.success) {
    throw new Error('Schedule with endTime < startTime must fail validation');
  }
  console.log('  ✓ Inverted start/end times correctly rejected');

  // Equal start and end time must fail
  const equalTime = {
    subjectId: '507f1f77bcf86cd799439011',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '10:00',
    roomNumber: 'Hall B-201',
    batch: 'CS-2026-A',
  };
  const resEqualTime = createScheduleSchema.safeParse(equalTime);
  if (resEqualTime.success) {
    throw new Error('Schedule with endTime == startTime must fail validation');
  }
  console.log('  ✓ Zero-duration slot (startTime == endTime) correctly rejected');

  // Invalid time format (e.g. 25:99) must fail
  const invalidTimeFormat = {
    subjectId: '507f1f77bcf86cd799439011',
    dayOfWeek: 1,
    startTime: '25:99',
    endTime: '26:00',
    roomNumber: 'Hall B-201',
    batch: 'CS-2026-A',
  };
  const resFormat = createScheduleSchema.safeParse(invalidTimeFormat);
  if (resFormat.success) {
    throw new Error('Schedule with invalid 24hr time format must fail validation');
  }
  console.log('  ✓ Invalid 24hr time format correctly rejected');

  // Test 3: Conflict Interval Overlap Engine
  console.log('\n[Test 3] Testing Time Conflict Overlap Engine...');

  // Overlapping intervals
  const overlap1 = doTimeRangesOverlap('09:00', '10:30', '10:00', '11:30');
  if (!overlap1) throw new Error('09:00-10:30 and 10:00-11:30 must overlap');
  console.log('  ✓ Partial overlap (09:00-10:30 vs 10:00-11:30) detected');

  const overlapEnclosing = doTimeRangesOverlap('08:00', '12:00', '09:00', '10:00');
  if (!overlapEnclosing) throw new Error('08:00-12:00 and 09:00-10:00 must overlap');
  console.log('  ✓ Enclosing interval overlap detected');

  // Adjacent intervals (Back-to-back classes) must NOT overlap
  const backToBack = doTimeRangesOverlap('09:00', '10:00', '10:00', '11:00');
  if (backToBack) throw new Error('Adjacent classes (09:00-10:00 and 10:00-11:00) must NOT overlap');
  console.log('  ✓ Back-to-back adjacent slots (09:00-10:00 and 10:00-11:00) properly permitted');

  // Disjoint intervals
  const disjoint = doTimeRangesOverlap('09:00', '10:00', '14:00', '15:00');
  if (disjoint) throw new Error('Disjoint classes must NOT overlap');
  console.log('  ✓ Disjoint slots (09:00-10:00 vs 14:00-15:00) verified non-conflicting');

  // Test 4: Real-time Active Class Detection Engine
  console.log('\n[Test 4] Testing Active Class & Countdown Calculation...');

  const sampleMondayClasses = [
    { code: 'CS402', startTime: '09:00', endTime: '10:30', room: 'Hall B-201' },
    { code: 'CS405', startTime: '11:00', endTime: '12:30', room: 'Auditorium 3' },
    { code: 'CS402-LAB', startTime: '14:00', endTime: '16:00', room: 'Lab 4' },
  ];

  // Helper for active class check
  const detectActive = (time: string, slots: typeof sampleMondayClasses) => {
    return slots.find((s) => s.startTime <= time && s.endTime > time) || null;
  };

  const detectNext = (time: string, slots: typeof sampleMondayClasses) => {
    const upcoming = slots.filter((s) => s.startTime > time);
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  // Case A: 09:15 AM (During CS402)
  const activeA = detectActive('09:15', sampleMondayClasses);
  if (!activeA || activeA.code !== 'CS402') {
    throw new Error('At 09:15, CS402 should be active');
  }
  console.log('  ✓ At 09:15 AM: CS402 correctly identified as active class');

  // Case B: 10:45 AM (Between CS402 and CS405)
  const activeB = detectActive('10:45', sampleMondayClasses);
  const nextB = detectNext('10:45', sampleMondayClasses);
  if (activeB !== null || !nextB || nextB.code !== 'CS405') {
    throw new Error('At 10:45, no active class and next class should be CS405');
  }
  console.log('  ✓ At 10:45 AM: No ongoing class; next upcoming class identified as CS405');

  // Case C: 17:00 PM (After all classes)
  const activeC = detectActive('17:00', sampleMondayClasses);
  const nextC = detectNext('17:00', sampleMondayClasses);
  if (activeC !== null || nextC !== null) {
    throw new Error('At 17:00, all classes finished');
  }
  console.log('  ✓ At 17:00 PM: Schedule completed for the day');

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 3 TIMETABLE & CONFLICT ENGINE TESTS PASSED!');
  console.log('======================================================\n');
  process.exit(0);
}

runTimetableTests().catch((err) => {
  console.error('\n❌ Timetable Test Failure:', err);
  process.exit(1);
});
