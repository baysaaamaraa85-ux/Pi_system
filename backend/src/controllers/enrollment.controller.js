import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSms } from '../services/sms.service.js';

// 75 цагийн багцын тогтмол үнэ (payment.html-тэй ижил)
const PACKAGE = { hours: 75, amount: 450_000 };

const DAY_NAMES = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

// POST /api/enrollment-requests — wizard-ийн эцсийн хүсэлт
export const createEnrollmentRequest = async (req, res, next) => {
  try {
    const {
      branchId,
      teacherId,
      availabilityId,
      parent = {},
      student = {},
      level,
      goals,
    } = req.body;

    const parentName = String(parent.name || '').trim();
    const parentPhone = String(parent.phone || '').trim();

    if (!parentName || !parentPhone) {
      throw new AppError('Эцэг эхийн нэр, утас заавал шаардлагатай', 400);
    }
    if (!String(student.name || '').trim()) {
      throw new AppError('Сурагчийн нэр заавал шаардлагатай', 400);
    }
    if (!teacherId || !availabilityId) {
      throw new AppError('Багш болон хуваарь сонгогдоогүй байна', 400);
    }

    // Сонгосон нээлттэй цаг тухайн багшийнх мөн эсэхийг шалгана
    const slotResult = await pool.query(
      `SELECT ta.id, ta.teacher_id, ta.day_of_week, ta.start_time, ta.end_time, ta.subject,
              t.branch_id, u.first_name AS teacher_name, u.phone AS teacher_phone,
              b.name AS branch_name, b.phone AS branch_phone
       FROM teacher_availability ta
       JOIN teachers t ON t.id = ta.teacher_id
       JOIN users u ON u.id = t.user_id
       LEFT JOIN branches b ON b.id = t.branch_id
       WHERE ta.id = $1 AND ta.teacher_id = $2 AND ta.is_active = true`,
      [availabilityId, teacherId]
    );

    if (slotResult.rows.length === 0) {
      throw new AppError('Сонгосон хуваарь олдсонгүй эсвэл өөр багшийнх байна', 404);
    }

    const slot = slotResult.rows[0];

    const goalsArray = Array.isArray(goals)
      ? goals.map((g) => String(g)).filter(Boolean)
      : null;

    const result = await pool.query(
      `INSERT INTO enrollment_requests
        (branch_id, teacher_id, availability_id,
         parent_name, parent_phone, parent_email,
         student_name, student_age, student_grade, student_school, student_level, goals,
         day_of_week, start_time, end_time, subject,
         package_hours, amount)
       VALUES ($1,$2,$3, $4,$5,$6, $7,$8,$9,$10,$11,$12, $13,$14,$15,$16, $17,$18)
       RETURNING id, status, amount, package_hours, created_at`,
      [
        branchId || slot.branch_id || null,
        teacherId,
        availabilityId,
        parentName,
        parentPhone,
        String(parent.email || '').trim() || null,
        String(student.name).trim(),
        Number(student.age) || null,
        String(student.grade || '').trim() || null,
        String(student.school || '').trim() || null,
        level || null,
        goalsArray,
        slot.day_of_week,
        slot.start_time,
        slot.end_time,
        slot.subject || null,
        PACKAGE.hours,
        PACKAGE.amount,
      ]
    );

    const row = result.rows[0];
    const dayName = DAY_NAMES[slot.day_of_week] || '';
    const timeLabel = `${String(slot.start_time).slice(0, 5)}–${String(slot.end_time).slice(0, 5)}`;

    // Багш/салбарт мэдэгдэл (stub SMS — зөвхөн лог)
    await sendSms({
      to: slot.teacher_phone || slot.branch_phone,
      message:
        `Шинэ бүртгэлийн хүсэлт #${row.id}: ${student.name} (${parentName}, ${parentPhone}). ` +
        `Багш ${slot.teacher_name}, ${dayName} ${timeLabel}. Та баталгаажуулна уу.`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Таны хүсэлтийг хүлээн авлаа. Ажилтан удахгүй холбогдож төлбөр болон хуваарийг баталгаажуулна.',
      data: {
        id: row.id,
        status: row.status,
        amount: row.amount,
        packageHours: row.package_hours,
        teacherName: slot.teacher_name,
        branchName: slot.branch_name,
        dayOfWeek: slot.day_of_week,
        dayName,
        startTime: String(slot.start_time).slice(0, 5),
        endTime: String(slot.end_time).slice(0, 5),
        subject: slot.subject || null,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/enrollment-requests/:id — хүсэлтийн төлөв
export const getEnrollmentRequest = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT er.*, u.first_name AS teacher_name, b.name AS branch_name
       FROM enrollment_requests er
       LEFT JOIN teachers t ON t.id = er.teacher_id
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN branches b ON b.id = er.branch_id
       WHERE er.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Хүсэлт олдсонгүй', 404);
    }

    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        status: r.status,
        amount: r.amount,
        packageHours: r.package_hours,
        parentName: r.parent_name,
        studentName: r.student_name,
        teacherName: r.teacher_name,
        branchName: r.branch_name,
        dayOfWeek: r.day_of_week,
        dayName: DAY_NAMES[r.day_of_week] || '',
        startTime: r.start_time ? String(r.start_time).slice(0, 5) : null,
        endTime: r.end_time ? String(r.end_time).slice(0, 5) : null,
        subject: r.subject || null,
        createdAt: r.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
