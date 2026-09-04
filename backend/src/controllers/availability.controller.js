import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Нэвтэрсэн хэрэглэгчийн teacher мөрийг олох
async function getTeacherByUserId(userId) {
  const result = await pool.query(
    'SELECT id, branch_id FROM teachers WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    throw new AppError('Багшийн профайл олдсонгүй', 404);
  }
  return result.rows[0];
}

function mapSlot(row) {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    dayOfWeek: row.day_of_week,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    subject: row.subject || null,
    maxStudents: row.max_students ?? 6,
  };
}

// "HH:MM" эсвэл "HH:MM:SS" -> "HH:MM"
function normTime(t) {
  return String(t || '').slice(0, 5);
}

function isValidTime(t) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(normTime(t));
}

// GET /api/availability/teacher/:id — багшийн 7 хоногийн нээлттэй цагууд (нээлттэй)
// schedule-select.html цагийн хүснэгтээ эндээс байгуулна.
export const getTeacherAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    const teacherResult = await pool.query(
      'SELECT id FROM teachers WHERE id = $1 AND is_active = true',
      [id]
    );

    if (teacherResult.rows.length === 0) {
      throw new AppError('Багш олдсонгүй', 404);
    }

    const result = await pool.query(
      `SELECT id, teacher_id, day_of_week, start_time, end_time, subject, max_students
       FROM teacher_availability
       WHERE teacher_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [id]
    );

    res.json({ success: true, data: result.rows.map(mapSlot) });
  } catch (error) {
    next(error);
  }
};

// GET /api/availability/me — нэвтэрсэн багшийн өөрийн нээлттэй цагууд
export const getMyAvailability = async (req, res, next) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);

    const result = await pool.query(
      `SELECT id, teacher_id, day_of_week, start_time, end_time, subject, max_students
       FROM teacher_availability
       WHERE teacher_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [teacher.id]
    );

    res.json({ success: true, data: result.rows.map(mapSlot) });
  } catch (error) {
    next(error);
  }
};

// POST /api/availability — нэг нээлттэй цаг нэмэх
export const createAvailability = async (req, res, next) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    const { dayOfWeek, startTime, endTime, subject, maxStudents } = req.body;

    const day = Number(dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new AppError('dayOfWeek нь 0-6 хооронд байна', 400);
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      throw new AppError('Цагийн формат буруу байна (HH:MM)', 400);
    }
    if (normTime(startTime) >= normTime(endTime)) {
      throw new AppError('Дуусах цаг эхлэх цагаас хойш байх ёстой', 400);
    }

    const result = await pool.query(
      `INSERT INTO teacher_availability
         (teacher_id, day_of_week, start_time, end_time, subject, max_students, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (teacher_id, day_of_week, start_time, end_time)
       DO UPDATE SET is_active = true, subject = EXCLUDED.subject, max_students = EXCLUDED.max_students
       RETURNING id, teacher_id, day_of_week, start_time, end_time, subject, max_students`,
      [teacher.id, day, normTime(startTime), normTime(endTime), subject || null, Number(maxStudents) || 6]
    );

    res.status(201).json({
      success: true,
      message: 'Нээлттэй цаг нэмэгдлээ',
      data: mapSlot(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/availability/me — багшийн бүх нээлттэй цагийг сүлжээ (grid)-ээр солих
// body: { subject, maxStudents, slots: [{ dayOfWeek, startTime, endTime }] }
export const replaceMyAvailability = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    const { subject = null, maxStudents = 6, slots } = req.body;

    if (!Array.isArray(slots)) {
      throw new AppError('slots массив шаардлагатай', 400);
    }

    const cap = Number(maxStudents) || 6;
    if (cap < 1 || cap > 20) {
      throw new AppError('Багтаамж 1-20 хооронд байна', 400);
    }

    // Цэвэрлэж, дахин бүтээх — давхардлыг арилгана
    const seen = new Set();
    const clean = [];
    for (const s of slots) {
      const day = Number(s.dayOfWeek);
      const start = normTime(s.startTime);
      const end = normTime(s.endTime || addHour(start));
      if (!Number.isInteger(day) || day < 0 || day > 6) continue;
      if (!isValidTime(start) || !isValidTime(end) || start >= end) continue;
      const key = `${day}|${start}|${end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push({ day, start, end });
    }

    await client.query('BEGIN');

    // Одоо байгаа бүх идэвхтэйг идэвхгүй болгоно
    await client.query(
      'UPDATE teacher_availability SET is_active = false WHERE teacher_id = $1',
      [teacher.id]
    );

    for (const s of clean) {
      await client.query(
        `INSERT INTO teacher_availability
           (teacher_id, day_of_week, start_time, end_time, subject, max_students, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (teacher_id, day_of_week, start_time, end_time)
         DO UPDATE SET is_active = true, subject = EXCLUDED.subject, max_students = EXCLUDED.max_students`,
        [teacher.id, s.day, s.start, s.end, subject, cap]
      );
    }

    await client.query('COMMIT');

    const result = await client.query(
      `SELECT id, teacher_id, day_of_week, start_time, end_time, subject, max_students
       FROM teacher_availability
       WHERE teacher_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [teacher.id]
    );

    res.json({
      success: true,
      message: `${result.rows.length} нээлттэй цаг хадгалагдлаа`,
      data: result.rows.map(mapSlot),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

// DELETE /api/availability/:id — нэг цаг идэвхгүй болгох
export const deleteAvailability = async (req, res, next) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);

    const result = await pool.query(
      `UPDATE teacher_availability SET is_active = false
       WHERE id = $1 AND teacher_id = $2
       RETURNING id`,
      [req.params.id, teacher.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Нээлттэй цаг олдсонгүй', 404);
    }

    res.json({ success: true, message: 'Нээлттэй цаг устгагдлаа' });
  } catch (error) {
    next(error);
  }
};

function addHour(hhmm) {
  const [h, m] = normTime(hhmm).split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
}
