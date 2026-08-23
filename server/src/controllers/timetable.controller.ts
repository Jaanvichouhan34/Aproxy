import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Subject, ISubject } from '../models/Subject';
import { ClassSchedule, IClassSchedule } from '../models/ClassSchedule';
import { User } from '../models/User';
import { checkScheduleConflict } from '../services/conflict.service';

/**
 * Helper to get current HH:MM string from a Date
 */
const getCurrentTimeString = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Calculate difference in minutes between two HH:MM strings
 */
const getMinutesDifference = (fromTime: string, toTime: string): number => {
  const [h1, m1] = fromTime.split(':').map(Number);
  const [h2, m2] = toTime.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

// ==========================================
// SUBJECT CONTROLLERS
// ==========================================

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    let query: any = {};
    if (userRole === 'teacher') {
      query = { teacherId: userId };
    }

    const subjects = await Subject.find(query)
      .populate('teacherId', 'name email department')
      .sort({ code: 1 });

    res.status(200).json({
      success: true,
      subjects,
    });
  } catch (error: any) {
    console.error('[GetSubjects Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch academic subjects',
      error: error?.message,
    });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { code, name, department, colorTag } = req.body;

    const existing = await Subject.findOne({
      code: code.toUpperCase().trim(),
      teacherId: userId,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Subject with code ${code.toUpperCase()} already exists for this instructor.`,
        code: 'SUBJECT_EXISTS',
      });
      return;
    }

    const subject = new Subject({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      department: department?.trim() || 'Computer Science & Engineering',
      teacherId: userId,
      colorTag: colorTag?.trim() || '#6366F1',
    });

    const savedSubject = await subject.save();

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: savedSubject,
    });
  } catch (error: any) {
    console.error('[CreateSubject Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: error?.message,
    });
  }
};

// ==========================================
// TIMETABLE SCHEDULE CONTROLLERS
// ==========================================

export const getTeacherSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.userId;

    const schedules = await ClassSchedule.find({ teacherId })
      .populate('subjectId', 'code name department colorTag')
      .populate('teacherId', 'name email department')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      schedule: schedules,
    });
  } catch (error: any) {
    console.error('[GetTeacherSchedule Error]', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher's timetable schedule",
      error: error?.message,
    });
  }
};

export const getStudentSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    const department = user?.department || 'Computer Science & Engineering';

    // Find all subjects in student's department or enrolled
    const subjects = await Subject.find({ department }).select('_id');
    const subjectIds = subjects.map((s) => s._id);

    const schedules = await ClassSchedule.find({
      $or: [
        { subjectId: { $in: subjectIds } },
        { batch: { $in: ['CS-2026-A', 'All Batches', 'Year 4 / CS'] } },
      ],
    })
      .populate('subjectId', 'code name department colorTag')
      .populate('teacherId', 'name email department')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      schedule: schedules,
    });
  } catch (error: any) {
    console.error('[GetStudentSchedule Error]', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student's timetable schedule",
      error: error?.message,
    });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.userId;
    const { subjectId, dayOfWeek, startTime, endTime, roomNumber, batch, classType } = req.body;

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({
        success: false,
        message: 'The selected subject does not exist.',
        code: 'SUBJECT_NOT_FOUND',
      });
      return;
    }

    // Check for collisions (Teacher, Room, Batch)
    const conflict = await checkScheduleConflict({
      teacherId: teacherId!,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber,
      batch: batch || 'CS-2026-A',
    });

    if (conflict.hasConflict) {
      res.status(409).json({
        success: false,
        message: conflict.message,
        conflictType: conflict.conflictType,
        conflictingSlot: conflict.conflictingSlot,
      });
      return;
    }

    // Create schedule slot
    const newSchedule = new ClassSchedule({
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber: roomNumber.trim(),
      batch: batch?.trim() || 'CS-2026-A',
      classType: classType || 'Lecture',
    });

    const savedSchedule = await newSchedule.save();
    const populated = await ClassSchedule.findById(savedSchedule._id)
      .populate('subjectId', 'code name department colorTag')
      .populate('teacherId', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Class schedule slot booked successfully',
      slot: populated,
    });
  } catch (error: any) {
    console.error('[CreateSchedule Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule slot',
      error: error?.message,
    });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.userId;

    const existingSlot = await ClassSchedule.findById(id);
    if (!existingSlot) {
      res.status(404).json({
        success: false,
        message: 'Class schedule slot not found',
        code: 'SLOT_NOT_FOUND',
      });
      return;
    }

    if (existingSlot.teacherId.toString() !== teacherId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this schedule slot.',
        code: 'UNAUTHORIZED_SLOT_UPDATE',
      });
      return;
    }

    const { subjectId, dayOfWeek, startTime, endTime, roomNumber, batch, classType } = req.body;

    const nextSubjectId = subjectId || existingSlot.subjectId.toString();
    const nextDay = dayOfWeek !== undefined ? dayOfWeek : existingSlot.dayOfWeek;
    const nextStart = startTime || existingSlot.startTime;
    const nextEnd = endTime || existingSlot.endTime;
    const nextRoom = roomNumber || existingSlot.roomNumber;
    const nextBatch = batch || existingSlot.batch;
    const nextClassType = classType || existingSlot.classType;

    // Check conflicts excluding this slot
    const conflict = await checkScheduleConflict({
      teacherId: teacherId!,
      dayOfWeek: nextDay,
      startTime: nextStart,
      endTime: nextEnd,
      roomNumber: nextRoom,
      batch: nextBatch,
      excludeScheduleId: id,
    });

    if (conflict.hasConflict) {
      res.status(409).json({
        success: false,
        message: conflict.message,
        conflictType: conflict.conflictType,
        conflictingSlot: conflict.conflictingSlot,
      });
      return;
    }

    existingSlot.subjectId = new mongoose.Types.ObjectId(nextSubjectId);
    existingSlot.dayOfWeek = nextDay;
    existingSlot.startTime = nextStart;
    existingSlot.endTime = nextEnd;
    existingSlot.roomNumber = nextRoom.trim();
    existingSlot.batch = nextBatch.trim();
    existingSlot.classType = nextClassType;

    const updated = await existingSlot.save();
    const populated = await ClassSchedule.findById(updated._id)
      .populate('subjectId', 'code name department colorTag')
      .populate('teacherId', 'name email department');

    res.status(200).json({
      success: true,
      message: 'Schedule slot updated successfully',
      slot: populated,
    });
  } catch (error: any) {
    console.error('[UpdateSchedule Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule slot',
      error: error?.message,
    });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.userId;

    const slot = await ClassSchedule.findById(id);
    if (!slot) {
      res.status(404).json({
        success: false,
        message: 'Schedule slot not found',
        code: 'SLOT_NOT_FOUND',
      });
      return;
    }

    if (slot.teacherId.toString() !== teacherId?.toString()) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this schedule slot.',
        code: 'UNAUTHORIZED_SLOT_DELETE',
      });
      return;
    }

    await ClassSchedule.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Schedule slot removed successfully',
      deletedId: id,
    });
  } catch (error: any) {
    console.error('[DeleteSchedule Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule slot',
      error: error?.message,
    });
  }
};

export const getActiveClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Optional query overrides for client-driven or simulated time
    const clientDayQuery = req.query.clientDay ? parseInt(req.query.clientDay as string, 10) : undefined;
    const clientTimeQuery = req.query.clientTime as string | undefined;

    const now = new Date();
    const currentDay = clientDayQuery !== undefined && !isNaN(clientDayQuery) ? clientDayQuery : now.getDay();
    const currentTime = clientTimeQuery && /^([01]\d|2[0-3]):([0-5]\d)$/.test(clientTimeQuery)
      ? clientTimeQuery
      : getCurrentTimeString(now);

    let query: any = { dayOfWeek: currentDay };

    if (userRole === 'teacher') {
      query.teacherId = userId;
    } else {
      // Student: matching subjects/batch
      const user = await User.findById(userId);
      const department = user?.department || 'Computer Science & Engineering';
      const subjects = await Subject.find({ department }).select('_id');
      const subjectIds = subjects.map((s) => s._id);

      query.$or = [
        { subjectId: { $in: subjectIds } },
        { batch: { $in: ['CS-2026-A', 'All Batches', 'Year 4 / CS'] } },
      ];
    }

    // Fetch all slots for current day
    const daySchedules = await ClassSchedule.find(query)
      .populate('subjectId', 'code name department colorTag')
      .populate('teacherId', 'name email department')
      .sort({ startTime: 1 });

    // 1. Detect currently active ongoing class
    const activeSlot = daySchedules.find(
      (slot) => slot.startTime <= currentTime && slot.endTime > currentTime
    );

    // 2. Find next upcoming class today
    const upcomingToday = daySchedules.filter((slot) => slot.startTime > currentTime);
    const nextSlotToday = upcomingToday.length > 0 ? upcomingToday[0] : null;

    let timeRemainingMinutes = 0;
    if (activeSlot) {
      timeRemainingMinutes = getMinutesDifference(currentTime, activeSlot.endTime);
    }

    let startsInMinutes = 0;
    if (nextSlotToday) {
      startsInMinutes = getMinutesDifference(currentTime, nextSlotToday.startTime);
    }

    res.status(200).json({
      success: true,
      hasActiveClass: !!activeSlot,
      activeClass: activeSlot || null,
      nextClass: nextSlotToday || null,
      timeRemainingMinutes,
      startsInMinutes,
      currentTime,
      currentDay,
      totalClassesToday: daySchedules.length,
    });
  } catch (error: any) {
    console.error('[GetActiveClass Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate real-time active classroom',
      error: error?.message,
    });
  }
};

export const seedSampleTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.userId;
    if (!teacherId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // 1. Create or find standard curriculum subjects
    const sampleSubjectsData = [
      {
        code: 'CS402',
        name: 'Network Security & Applied Cryptography',
        department: 'Computer Science & Engineering',
        colorTag: '#6366F1', // Indigo
      },
      {
        code: 'CS405',
        name: 'Distributed Systems & Fault Tolerance',
        department: 'Computer Science & Engineering',
        colorTag: '#06B6D4', // Cyan
      },
      {
        code: 'CS409',
        name: 'Zero-Knowledge Identity & Privacy Protocols',
        department: 'Computer Science & Engineering',
        colorTag: '#8B5CF6', // Purple
      },
      {
        code: 'CS499',
        name: 'Senior Capstone Architecture Defense',
        department: 'Computer Science & Engineering',
        colorTag: '#EC4899', // Pink
      },
    ];

    const subjectMap: Record<string, any> = {};

    for (const sub of sampleSubjectsData) {
      let subjectDoc = await Subject.findOne({ code: sub.code, teacherId });
      if (!subjectDoc) {
        subjectDoc = await Subject.create({
          ...sub,
          teacherId,
        });
      }
      subjectMap[sub.code] = subjectDoc._id;
    }

    // 2. Clear old teacher schedules to ensure clean, non-colliding standard demo set
    await ClassSchedule.deleteMany({ teacherId });

    // 3. Create rich weekly schedule (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5)
    const sampleSlots = [
      // Monday
      {
        subjectId: subjectMap['CS402'],
        teacherId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:30',
        roomNumber: 'Hall B-201',
        batch: 'CS-2026-A',
        classType: 'Lecture',
      },
      {
        subjectId: subjectMap['CS405'],
        teacherId,
        dayOfWeek: 1, // Monday
        startTime: '11:00',
        endTime: '12:30',
        roomNumber: 'Auditorium 3',
        batch: 'CS-2026-A',
        classType: 'Lecture',
      },
      {
        subjectId: subjectMap['CS402'],
        teacherId,
        dayOfWeek: 1, // Monday
        startTime: '14:00',
        endTime: '16:00',
        roomNumber: 'Security Lab 4',
        batch: 'CS-2026-A',
        classType: 'Lab Session',
      },

      // Tuesday
      {
        subjectId: subjectMap['CS409'],
        teacherId,
        dayOfWeek: 2, // Tuesday
        startTime: '10:00',
        endTime: '11:30',
        roomNumber: 'Hall A-102',
        batch: 'CS-2026-A',
        classType: 'Lecture',
      },
      {
        subjectId: subjectMap['CS402'],
        teacherId,
        dayOfWeek: 2, // Tuesday
        startTime: '13:30',
        endTime: '15:00',
        roomNumber: 'Hall B-201',
        batch: 'CS-2026-A',
        classType: 'Tutorial',
      },

      // Wednesday
      {
        subjectId: subjectMap['CS405'],
        teacherId,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00',
        endTime: '10:30',
        roomNumber: 'Auditorium 3',
        batch: 'CS-2026-A',
        classType: 'Lecture',
      },
      {
        subjectId: subjectMap['CS409'],
        teacherId,
        dayOfWeek: 3, // Wednesday
        startTime: '14:00',
        endTime: '15:30',
        roomNumber: 'Hall A-102',
        batch: 'CS-2026-A',
        classType: 'Seminar',
      },

      // Thursday
      {
        subjectId: subjectMap['CS402'],
        teacherId,
        dayOfWeek: 4, // Thursday
        startTime: '11:00',
        endTime: '12:30',
        roomNumber: 'Hall B-201',
        batch: 'CS-2026-A',
        classType: 'Lecture',
      },

      // Friday
      {
        subjectId: subjectMap['CS405'],
        teacherId,
        dayOfWeek: 5, // Friday
        startTime: '10:00',
        endTime: '12:00',
        roomNumber: 'Cloud Lab 2',
        batch: 'CS-2026-A',
        classType: 'Lab Session',
      },
      {
        subjectId: subjectMap['CS499'],
        teacherId,
        dayOfWeek: 5, // Friday
        startTime: '15:00',
        endTime: '16:30',
        roomNumber: 'Conference Room 1',
        batch: 'CS-2026-A',
        classType: 'Evaluation',
      },
    ];

    const inserted = await ClassSchedule.insertMany(sampleSlots);

    res.status(201).json({
      success: true,
      message: `Seeded ${inserted.length} schedule slots across standard curriculum`,
      count: inserted.length,
    });
  } catch (error: any) {
    console.error('[SeedSampleTimetable Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample timetable',
      error: error?.message,
    });
  }
};
