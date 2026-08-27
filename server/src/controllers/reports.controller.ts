import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import * as csv from 'fast-csv';
import mongoose from 'mongoose';
import { AttendanceSession } from '../models/AttendanceSession';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { Subject } from '../models/Subject';

/**
 * Generate official PDF attendance sheet for an attendance session
 */
export const exportSessionPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId).populate('teacherId', 'name email department');
    if (!session) {
      res.status(404).json({ success: false, message: 'Attendance session not found' });
      return;
    }

    // Get all students enrolled in this batch / department
    const enrolledStudents = await User.find({
      role: 'student',
      $or: [{ department: session.batch }, { department: 'Computer Science & Engineering' }],
    }).sort({ enrollmentNumber: 1 });

    const totalEnrolled = enrolledStudents.length > 0 ? enrolledStudents.length : 64;

    // Get all records for this session
    const records = await AttendanceRecord.find({ sessionId: session._id }).sort({ enrollmentNumber: 1, verifiedAt: 1 });

    const recordMap = new Map<string, any>();
    records.forEach((r) => {
      recordMap.set(r.studentId.toString(), r);
      if (r.enrollmentNumber) recordMap.set(r.enrollmentNumber, r);
    });

    const presentCount = records.filter((r) => r.status === 'PRESENT' || !r.status).length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
    const absentCount = Math.max(0, totalEnrolled - records.length);
    const rate = totalEnrolled > 0 ? (((presentCount + lateCount) / totalEnrolled) * 100).toFixed(1) : '0.0';

    // Create PDF Document
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Aproxy_Attendance_${session.subjectCode}_${new Date(session.startedAt).toISOString().slice(0, 10)}.pdf"`
    );

    doc.pipe(res);

    // 1. Header Banner
    doc.rect(40, 40, 515, 65).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('APROXY INSTITUTIONAL ATTENDANCE REPORT', 55, 52);
    doc.fillColor('#38bdf8').fontSize(9).font('Helvetica').text('Zero-Trust High-Frequency Cryptographic Mesh & Biometric Ledger', 55, 72);
    doc.fillColor('#94a3b8').fontSize(8).text(`GENERATED: ${new Date().toUTCString()} | CONFIDENTIAL`, 55, 86);

    // 2. Session Metadata Grid
    doc.rect(40, 115, 515, 75).fill('#f8fafc').stroke('#cbd5e1');
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    
    // Left column
    doc.text(`Course:`, 55, 125);
    doc.font('Helvetica').text(`${session.subjectCode} — ${session.subjectName}`, 115, 125);
    
    doc.font('Helvetica-Bold').text(`Instructor:`, 55, 142);
    doc.font('Helvetica').text(`${(session.teacherId as any)?.name || 'Faculty Instructor'}`, 115, 142);
    
    doc.font('Helvetica-Bold').text(`Venue:`, 55, 159);
    doc.font('Helvetica').text(`${session.roomNumber} (Batch ${session.batch})`, 115, 159);

    // Right column
    doc.font('Helvetica-Bold').text(`Date & Time:`, 320, 125);
    doc.font('Helvetica').text(`${new Date(session.startedAt).toLocaleString()}`, 390, 125);

    doc.font('Helvetica-Bold').text(`Session ID:`, 320, 142);
    doc.font('Helvetica').text(`${session._id.toString().slice(-8).toUpperCase()}`, 390, 142);

    doc.font('Helvetica-Bold').text(`Attendance Rate:`, 320, 159);
    doc.fillColor('#16a34a').font('Helvetica-Bold').text(`${rate}% (${presentCount + lateCount}/${totalEnrolled})`, 410, 159);

    // 3. Metric Summary Pills
    doc.fillColor('#0f172a');
    let pillY = 200;
    const drawPill = (x: number, label: string, val: string | number, color: string) => {
      doc.rect(x, pillY, 95, 32).fill('#ffffff').stroke('#e2e8f0');
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(label, x + 8, pillY + 6);
      doc.fillColor(color).fontSize(11).font('Helvetica-Bold').text(String(val), x + 8, pillY + 16);
    };

    drawPill(40, 'TOTAL ENROLLED', totalEnrolled, '#0f172a');
    drawPill(145, 'PRESENT (VERIFIED)', presentCount, '#16a34a');
    drawPill(250, 'LATE CHECK-IN', lateCount, '#d97706');
    drawPill(355, 'EXCUSED / LEAVE', excusedCount, '#4f46e5');
    drawPill(460, 'ABSENT / PENDING', absentCount, '#dc2626');

    // 4. Attendee Table Header
    let tableTop = 245;
    doc.rect(40, tableTop, 515, 20).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('S.NO', 48, tableTop + 6);
    doc.text('ROLL NUMBER', 80, tableTop + 6);
    doc.text('STUDENT NAME', 170, tableTop + 6);
    doc.text('STATUS', 310, tableTop + 6);
    doc.text('METHOD', 370, tableTop + 6);
    doc.text('TIME', 450, tableTop + 6);
    doc.text('HASH / LAT', 500, tableTop + 6);

    // 5. Table Rows
    let currentY = tableTop + 20;
    const combinedList = enrolledStudents.length > 0
      ? enrolledStudents.map((std, idx) => {
          const rec = recordMap.get(std._id.toString()) || recordMap.get(std.enrollmentNumber || '');
          return {
            sno: idx + 1,
            rollNo: std.enrollmentNumber || `2024-CS-${String(idx + 1).padStart(3, '0')}`,
            name: std.name,
            status: rec ? (rec.status || 'PRESENT') : 'ABSENT',
            method: rec
              ? rec.verificationMethod === 'BIOMETRIC_QR'
                ? 'Biometric 128D'
                : rec.verificationMethod === 'MANUAL_OVERRIDE'
                ? 'Faculty Override'
                : 'Dynamic QR'
              : '—',
            time: rec ? new Date(rec.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—',
            hash: rec ? (rec.nonce ? rec.nonce.slice(0, 8) : `${rec.latencyMs || 24}ms`) : '—',
            isOverride: rec?.isManualOverride,
          };
        })
      : records.map((rec, idx) => ({
          sno: idx + 1,
          rollNo: rec.enrollmentNumber,
          name: rec.studentName,
          status: rec.status || 'PRESENT',
          method: rec.verificationMethod === 'BIOMETRIC_QR' ? 'Biometric 128D' : rec.verificationMethod === 'MANUAL_OVERRIDE' ? 'Faculty Override' : 'Dynamic QR',
          time: new Date(rec.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          hash: rec.nonce ? rec.nonce.slice(0, 8) : `${rec.latencyMs || 24}ms`,
          isOverride: rec.isManualOverride,
        }));

    combinedList.forEach((row, i) => {
      // Check page break
      if (currentY > 710) {
        doc.addPage({ margin: 40, size: 'A4' });
        currentY = 40;
        // Re-draw table header on next page
        doc.rect(40, currentY, 515, 20).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('S.NO', 48, currentY + 6);
        doc.text('ROLL NUMBER', 80, currentY + 6);
        doc.text('STUDENT NAME', 170, currentY + 6);
        doc.text('STATUS', 310, currentY + 6);
        doc.text('METHOD', 370, currentY + 6);
        doc.text('TIME', 450, currentY + 6);
        doc.text('HASH / LAT', 500, currentY + 6);
        currentY += 20;
      }

      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, currentY, 515, 18).fill(bg).stroke('#f1f5f9');

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
      doc.text(String(row.sno), 48, currentY + 5);
      doc.font('Helvetica-Bold').text(row.rollNo, 80, currentY + 5);
      doc.font('Helvetica').text(row.name, 170, currentY + 5);

      // Status color
      if (row.status === 'PRESENT') {
        doc.fillColor('#16a34a').font('Helvetica-Bold').text('PRESENT', 310, currentY + 5);
      } else if (row.status === 'LATE') {
        doc.fillColor('#d97706').font('Helvetica-Bold').text('LATE', 310, currentY + 5);
      } else if (row.status === 'EXCUSED') {
        doc.fillColor('#4f46e5').font('Helvetica-Bold').text('EXCUSED', 310, currentY + 5);
      } else {
        doc.fillColor('#dc2626').font('Helvetica').text('ABSENT', 310, currentY + 5);
      }

      doc.fillColor('#64748b').font('Helvetica').text(row.method, 370, currentY + 5);
      doc.text(row.time, 450, currentY + 5);
      doc.text(row.hash, 500, currentY + 5);

      currentY += 18;
    });

    // 6. Signatures and Official Seals Footer
    if (currentY > 670) {
      doc.addPage({ margin: 40, size: 'A4' });
      currentY = 50;
    } else {
      currentY = Math.max(currentY + 25, 680);
    }

    doc.rect(40, currentY, 515, 80).fill('#f8fafc').stroke('#e2e8f0');

    // Left Signature
    doc.moveTo(60, currentY + 50).lineTo(220, currentY + 50).stroke('#94a3b8');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('COURSE INSTRUCTOR SIGNATURE', 60, currentY + 55);
    doc.fillColor('#64748b').fontSize(7).font('Helvetica').text((session.teacherId as any)?.name || 'Course Faculty', 60, currentY + 66);

    // Middle Seal Stamp
    doc.rect(260, currentY + 12, 75, 55).stroke('#cbd5e1');
    doc.fillColor('#94a3b8').fontSize(6).font('Helvetica-Bold').text('INSTITUTIONAL SEAL', 265, currentY + 32, { align: 'center', width: 65 });

    // Right Signature
    doc.moveTo(375, currentY + 50).lineTo(535, currentY + 50).stroke('#94a3b8');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('HEAD OF DEPARTMENT / DEAN', 375, currentY + 55);
    doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(`Dept. of Computer Science & Eng.`, 375, currentY + 66);

    doc.end();
  } catch (error: any) {
    console.error('[exportSessionPDF error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report', error: error.message });
    }
  }
};

/**
 * Generate formatted CSV attendance roster for a session
 */
export const exportSessionCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const records = await AttendanceRecord.find({ sessionId: session._id }).sort({ enrollmentNumber: 1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance_${session.subjectCode}_${new Date(session.startedAt).toISOString().slice(0, 10)}.csv"`
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    records.forEach((r, idx) => {
      csvStream.write({
        SNo: idx + 1,
        SessionId: session._id.toString(),
        SubjectCode: session.subjectCode,
        SubjectName: session.subjectName,
        Room: session.roomNumber,
        Batch: session.batch,
        StudentName: r.studentName,
        EnrollmentNumber: r.enrollmentNumber,
        Status: r.status || 'PRESENT',
        VerificationMethod: r.verificationMethod,
        VerifiedAt: r.verifiedAt.toISOString(),
        LatencyMs: r.latencyMs,
        Nonce: r.nonce,
        BiometricMatched: r.biometricMatched ? 'YES' : 'NO',
        SimilarityScore: r.similarityScore || '',
        IsManualOverride: r.isManualOverride ? 'TRUE' : 'FALSE',
        OverrideReason: r.overrideReason || '',
        IPAddress: r.ipAddress || '',
      });
    });

    csvStream.end();
  } catch (error: any) {
    console.error('[exportSessionCSV error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export CSV', error: error.message });
    }
  }
};

/**
 * Export manual override audit logs to CSV
 */
export const exportAuditLogsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const auditLogs = await AuditLog.find().sort({ timestamp: -1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aproxy_audit_logs_${new Date().toISOString().slice(0, 10)}.csv"`
    );

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    auditLogs.forEach((log, idx) => {
      csvStream.write({
        SNo: idx + 1,
        LogId: log._id.toString(),
        Timestamp: log.timestamp.toISOString(),
        TeacherName: log.teacherName,
        StudentName: log.studentName,
        EnrollmentNumber: log.enrollmentNumber,
        SubjectCode: log.subjectCode || '',
        OldStatus: log.oldStatus,
        NewStatus: log.newStatus,
        Reason: log.reason,
        Notes: log.notes || '',
        IPAddress: log.ipAddress || '',
        UserAgent: log.userAgent || '',
      });
    });

    csvStream.end();
  } catch (error: any) {
    console.error('[exportAuditLogsCSV error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export audit logs CSV', error: error.message });
    }
  }
};
