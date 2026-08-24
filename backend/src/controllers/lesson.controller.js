import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Нэвтэрсэн багш өөрийн хуваарьт шинэ хичээл нэмэх
export const createLesson = async (req, res, next) => {
  try {
    const teacherResult = await pool.query('SELECT id, branch_id FROM teachers WHERE user_id = $1', [req.user.userId]);

    if (teacherResult.rows.length === 0) {
      throw new AppError('Багшийн профайл олдсонгүй', 404);
    }

    const teacher = teacherResult.rows[0];
    const { subject, date, hour, maxStudents } = req.body;

    if (!subject || !date || hour === undefined || hour === null) {
      throw new AppError('Хичээл, огноо, цаг шаардлагатай', 400);
    }

    const startTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    if (Number.isNaN(startTime.getTime())) {
      throw new AppError('Огноо буруу байна', 400);
    }

    let roomId = null;
    if (teacher.branch_id) {
      const roomResult = await pool.query('SELECT id FROM rooms WHERE branch_id = $1 LIMIT 1', [teacher.branch_id]);
      roomId = roomResult.rows[0]?.id || null;
    }

    const result = await pool.query(
      `INSERT INTO lessons (teacher_id, room_id, subject, start_time, end_time, max_students, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING id, subject, start_time, end_time, max_students`,
      [teacher.id, roomId, subject, startTime.toISOString(), endTime.toISOString(), maxStudents || 6]
    );

    res.status(201).json({
      success: true,
      message: 'Хичээл нэмэгдлээ',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Сурагчийг тодорхой хичээлийн цагт бүртгэх (Хуваарь алхам дээр сонгосон цаг)
export const enrollInLesson = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      throw new AppError('studentId шаардлагатай', 400);
    }

    await client.query('BEGIN');

    const lessonResult = await client.query(
      `SELECT l.id, l.max_students,
        (SELECT COUNT(*)::int FROM lesson_enrollments WHERE lesson_id = l.id) AS enrolled_count
       FROM lessons l
       WHERE l.id = $1
       FOR UPDATE`,
      [id]
    );

    if (lessonResult.rows.length === 0) {
      throw new AppError('Хичээл олдсонгүй', 404);
    }

    const lesson = lessonResult.rows[0];

    if (lesson.enrolled_count >= lesson.max_students) {
      throw new AppError('Уучлаарай, энэ цаг дүүрсэн байна', 400);
    }

    const insertResult = await client.query(
      `INSERT INTO lesson_enrollments (lesson_id, student_id) VALUES ($1, $2)
       ON CONFLICT (lesson_id, student_id) DO NOTHING`,
      [id, studentId]
    );

    await client.query('COMMIT');

    const newlyEnrolled = insertResult.rowCount > 0;

    res.json({
      success: true,
      message: 'Хуваарьт амжилттай бүртгэгдлээ',
      data: {
        lessonId: Number(id),
        enrolledCount: lesson.enrolled_count + (newlyEnrolled ? 1 : 0),
        maxStudents: lesson.max_students,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
