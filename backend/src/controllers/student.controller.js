import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Сурагчийн явц (75 цагийн багц)
export const getStudentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        s.id,
        s.total_hours,
        s.completed_hours,
        s.remaining_leaves,
        u.first_name,
        u.last_name,
        s.grade,
        s.school
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Сурагч олдсонгүй', 404);
    }

    const student = result.rows[0];
    const remainingHours = student.total_hours - parseFloat(student.completed_hours);
    const progressPercent = (parseFloat(student.completed_hours) / student.total_hours) * 100;

    res.json({
      success: true,
      data: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        grade: student.grade,
        school: student.school,
        totalHours: student.total_hours,
        completedHours: parseFloat(student.completed_hours),
        remainingHours: remainingHours,
        progressPercent: Math.round(progressPercent),
        remainingLeaves: student.remaining_leaves
      }
    });

  } catch (error) {
    next(error);
  }
};

// Сурагчийн хуваарь
export const getStudentSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        l.id,
        l.subject,
        l.start_time,
        l.end_time,
        l.status,
        u.first_name as teacher_first_name,
        u.last_name as teacher_last_name,
        r.room_number,
        r.floor,
        b.name as branch_name,
        b.address as branch_address
      FROM lesson_enrollments le
      JOIN lessons l ON le.lesson_id = l.id
      JOIN teachers t ON l.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN rooms r ON l.room_id = r.id
      LEFT JOIN branches b ON r.branch_id = b.id
      WHERE le.student_id = $1
    `;

    const params = [id];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND l.start_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND l.start_time <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY l.start_time`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(lesson => ({
        id: lesson.id,
        subject: lesson.subject,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        status: lesson.status,
        teacher: `${lesson.teacher_first_name} ${lesson.teacher_last_name}`,
        room: lesson.room_number,
        floor: lesson.floor,
        branch: {
          name: lesson.branch_name,
          address: lesson.branch_address
        }
      }))
    });

  } catch (error) {
    next(error);
  }
};

// Ирцийн түүх
export const getStudentAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT 
        a.id,
        a.checked_in_at,
        a.status,
        a.notes,
        l.subject,
        l.start_time,
        l.end_time,
        u.first_name as teacher_first_name,
        u.last_name as teacher_last_name
      FROM attendance a
      JOIN lessons l ON a.lesson_id = l.id
      JOIN teachers t ON l.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE a.student_id = $1
      ORDER BY l.start_time DESC
      LIMIT $2`,
      [id, limit]
    );

    res.json({
      success: true,
      data: result.rows.map(record => ({
        id: record.id,
        date: record.start_time,
        startTime: record.start_time,
        endTime: record.end_time,
        checkedInAt: record.checked_in_at,
        status: record.status,
        subject: record.subject,
        teacher: `${record.teacher_first_name} ${record.teacher_last_name}`,
        notes: record.notes
      }))
    });

  } catch (error) {
    next(error);
  }
};
