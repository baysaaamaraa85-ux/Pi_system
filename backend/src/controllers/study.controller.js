import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// "Суралцах эхний алхмаа хийе" хуудасны хүсэлт (pages/holbogdoh.html)
export const createStudyInquiry = async (req, res, next) => {
  try {
    const { studentName, school, grade, phone, programInterest } = req.body;

    if (!studentName || !phone) {
      throw new AppError('Нэр, утасны дугаар заавал шаардлагатай', 400);
    }

    const result = await pool.query(
      `INSERT INTO study_inquiries (student_name, school, grade, phone, program_interest)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [studentName, school || null, grade || null, phone, programInterest || null]
    );

    res.status(201).json({
      success: true,
      message: 'Бид хүлээн авлаа. Удахгүй танд залгах болно.',
      data: { id: result.rows[0].id, createdAt: result.rows[0].created_at },
    });
  } catch (error) {
    next(error);
  }
};
