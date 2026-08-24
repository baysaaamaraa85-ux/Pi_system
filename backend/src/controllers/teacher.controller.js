import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSms } from '../services/sms.service.js';

// Бүх багш нарын жагсаалт (шүүлтүүр, хайлт, эрэмбэлэх)
export const getAllTeachers = async (req, res, next) => {
  try {
    const {
      specialty,      // Хичээлийн чиглэл
      branchId,       // Салбар
      minRating,      // Хамгийн бага үнэлгээ
      maxPrice,       // Хамгийн их үнэ
      sortBy = 'rating',  // Эрэмбэлэх: rating, price, experience
      order = 'DESC',     // ASC эсвэл DESC
      search,         // Нэрээр хайх
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT
        t.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        t.branch_id,
        b.name AS branch_name,
        t.specialties,
        t.experience_years,
        t.rating,
        t.total_reviews,
        t.hourly_rate,
        t.bio,
        t.photo_url,
        t.is_active
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN branches b ON t.branch_id = b.id
      WHERE t.is_active = true
    `;

    const params = [];
    let paramCount = 0;

    // Шүүлтүүр нэмэх
    if (specialty) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(t.specialties)`;
      params.push(specialty);
    }

    if (branchId) {
      paramCount++;
      query += ` AND t.branch_id = $${paramCount}`;
      params.push(parseInt(branchId));
    }

    if (minRating) {
      paramCount++;
      query += ` AND t.rating >= $${paramCount}`;
      params.push(parseFloat(minRating));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND t.hourly_rate <= $${paramCount}`;
      params.push(parseInt(maxPrice));
    }

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Эрэмбэлэх
    const validSortFields = {
      rating: 't.rating',
      price: 't.hourly_rate',
      experience: 't.experience_years'
    };

    const sortField = validSortFields[sortBy] || 't.rating';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    // Нийт тоо авах
    let countQuery = `
      SELECT COUNT(*) 
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_active = true
    `;
    
    const countParams = [];
    let countParamIndex = 0;

    if (specialty) {
      countParamIndex++;
      countQuery += ` AND $${countParamIndex} = ANY(t.specialties)`;
      countParams.push(specialty);
    }

    if (branchId) {
      countParamIndex++;
      countQuery += ` AND t.branch_id = $${countParamIndex}`;
      countParams.push(parseInt(branchId));
    }

    if (minRating) {
      countParamIndex++;
      countQuery += ` AND t.rating >= $${countParamIndex}`;
      countParams.push(parseFloat(minRating));
    }

    if (maxPrice) {
      countParamIndex++;
      countQuery += ` AND t.hourly_rate <= $${countParamIndex}`;
      countParams.push(parseInt(maxPrice));
    }

    if (search) {
      countParamIndex++;
      countQuery += ` AND (u.first_name ILIKE $${countParamIndex} OR u.last_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows.map(teacher => ({
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        branchId: teacher.branch_id,
        branchName: teacher.branch_name,
        specialties: teacher.specialties,
        experienceYears: parseFloat(teacher.experience_years),
        rating: parseFloat(teacher.rating),
        totalReviews: teacher.total_reviews,
        hourlyRate: teacher.hourly_rate,
        bio: teacher.bio,
        photoUrl: teacher.photo_url
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// Нэг багшийн дэлгэрэнгүй мэдээлэл
export const getTeacherById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        t.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        t.branch_id,
        b.name AS branch_name,
        t.specialties,
        t.experience_years,
        t.rating,
        t.total_reviews,
        t.hourly_rate,
        t.bio,
        t.photo_url,
        t.is_active,
        t.created_at
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN branches b ON t.branch_id = b.id
      WHERE t.id = $1 AND t.is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Багш олдсонгүй', 404);
    }

    const teacher = result.rows[0];

    // Багшийн үнэлгээнүүдийг авах
    const reviewsResult = await pool.query(
      `SELECT 
        r.rating,
        r.comment,
        r.created_at,
        u.first_name,
        u.last_name
      FROM reviews r
      JOIN students s ON r.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE r.teacher_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        branchId: teacher.branch_id,
        branchName: teacher.branch_name,
        specialties: teacher.specialties,
        experienceYears: parseFloat(teacher.experience_years),
        rating: parseFloat(teacher.rating),
        totalReviews: teacher.total_reviews,
        hourlyRate: teacher.hourly_rate,
        bio: teacher.bio,
        photoUrl: teacher.photo_url,
        createdAt: teacher.created_at,
        reviews: reviewsResult.rows.map(review => ({
          rating: review.rating,
          comment: review.comment,
          studentName: `${review.first_name} ${review.last_name}`,
          createdAt: review.created_at
        }))
      }
    });

  } catch (error) {
    next(error);
  }
};

// Багшийн хуваарь
export const getTeacherSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        l.id,
        l.subject,
        l.start_time,
        l.end_time,
        l.max_students,
        l.status,
        r.room_number,
        r.floor,
        b.name as branch_name,
        COUNT(le.student_id) as enrolled_count
      FROM lessons l
      LEFT JOIN rooms r ON l.room_id = r.id
      LEFT JOIN branches b ON r.branch_id = b.id
      LEFT JOIN lesson_enrollments le ON l.id = le.lesson_id
      WHERE l.teacher_id = $1
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

    query += ` GROUP BY l.id, r.room_number, r.floor, b.name ORDER BY l.start_time`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(lesson => ({
        id: lesson.id,
        subject: lesson.subject,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        maxStudents: lesson.max_students,
        enrolledCount: parseInt(lesson.enrolled_count),
        status: lesson.status,
        room: lesson.room_number,
        floor: lesson.floor,
        branch: lesson.branch_name
      }))
    });

  } catch (error) {
    next(error);
  }
};

// "Багштай холбогдмоор байна уу?" хүсэлт — багшийн утсанд SMS илгээнэ
export const createContactRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parentName, phone, program } = req.body;

    if (!parentName || !phone) {
      throw new AppError('Нэр, утасны дугаар заавал шаардлагатай', 400);
    }

    const teacherResult = await pool.query(
      `SELECT u.phone AS teacher_phone, u.first_name, u.last_name
       FROM teachers t JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 AND t.is_active = true`,
      [id]
    );

    if (teacherResult.rows.length === 0) {
      throw new AppError('Багш олдсонгүй', 404);
    }

    const teacher = teacherResult.rows[0];
    const message = `Шинэ хүсэлт: ${parentName} (${phone})${program ? ` — ${program}` : ''} танд холбогдмоор байна. Та утсаар холбогдоно уу.`;

    const smsResult = await sendSms({ to: teacher.teacher_phone, message });

    const result = await pool.query(
      `INSERT INTO contact_requests (teacher_id, parent_name, phone, program, message, sms_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [id, parentName, phone, program || null, message, smsResult.success ? 'sent' : 'failed']
    );

    res.status(201).json({
      success: true,
      message: `${teacher.first_name} багш тантай удахгүй холбогдох болно`,
      data: { id: result.rows[0].id, createdAt: result.rows[0].created_at },
    });
  } catch (error) {
    next(error);
  }
};
