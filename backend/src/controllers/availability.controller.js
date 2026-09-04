import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// GET /api/availability/teacher/:id — багшийн 7 хоногийн нээлттэй цагууд
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
      `SELECT id, teacher_id, day_of_week, start_time, end_time, subject
       FROM teacher_availability
       WHERE teacher_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        teacherId: row.teacher_id,
        dayOfWeek: row.day_of_week,
        startTime: String(row.start_time).slice(0, 5),
        endTime: String(row.end_time).slice(0, 5),
        subject: row.subject || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};
