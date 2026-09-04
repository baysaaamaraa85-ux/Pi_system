import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// JWT token үүсгэх
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Бүртгүүлэх
export const register = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { email, password, firstName, lastName, phone, role, ...additionalData } = req.body;

    // И-мэйл шалгах
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Энэ и-мэйл аль хэдийн бүртгэлтэй байна', 400);
    }

    // Нууц үг hash хийх
    const passwordHash = await bcrypt.hash(password, 10);

    // Хэрэглэгч үүсгэх
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
      [email, passwordHash, role, firstName, lastName, phone]
    );

    const user = userResult.rows[0];
    let studentId = null;

    // Төрлөөс хамааран нэмэлт мэдээлэл оруулах
    if (role === 'student') {
      const { age, grade, school, currentLevel, goals } = additionalData;
      await client.query(
        `INSERT INTO students (user_id, age, grade, school, current_level, goals)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, age, grade, school, currentLevel, goals]
      );
    } else if (role === 'teacher') {
      const { specialties, experienceYears, bio, branchId } = additionalData;
      await client.query(
        `INSERT INTO teachers (user_id, specialties, experience_years, hourly_rate, bio, branch_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, specialties, experienceYears || 0, 0, bio || null, branchId || null]
      );
    } else if (role === 'parent') {
      await client.query(
        'INSERT INTO parents (user_id) VALUES ($1)',
        [user.id]
      );

      // Хүүхдийн мэдээлэл ирсэн бол хүүхдэд зориулж хэрэглэгч + student бичлэг үүсгэнэ
      const { childData } = additionalData;
      if (childData) {
        const childEmail = `${email.split('@')[0]}.child${Date.now()}@pitoo.mn`;

        const childUserResult = await client.query(
          `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
           VALUES ($1, $2, 'student', $3, $4, $5)
           RETURNING id`,
          [childEmail, passwordHash, childData.firstName, childData.lastName, phone]
        );

        const childStudentResult = await client.query(
          `INSERT INTO students (user_id, parent_id, age, grade, school, current_level)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            childUserResult.rows[0].id,
            user.id,
            childData.age,
            childData.grade,
            childData.school,
            childData.assessmentNote || null,
          ]
        );

        studentId = childStudentResult.rows[0].id;
      }
    }

    await client.query('COMMIT');

    // Token үүсгэх
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Амжилттай бүртгэгдлээ',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone
        },
        studentId,
        token
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Нэвтрэх
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Хэрэглэгч хайх
    const result = await pool.query(
      `SELECT id, email, password_hash, role, first_name, last_name, phone
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('И-мэйл эсвэл нууц үг буруу байна', 401);
    }

    const user = result.rows[0];

    // Нууц үг шалгах
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('И-мэйл эсвэл нууц үг буруу байна', 401);
    }

    // Token үүсгэх
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Амжилттай нэвтэрлээ',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// Одоогийн хэрэглэгчийн мэдээлэл авах
export const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, first_name, last_name, phone, created_at
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Хэрэглэгч олдсонгүй', 404);
    }

    const user = result.rows[0];
    let studentId = null;
    let teacherId = null;

    // Профайлын бичлэг байхгүй бол автоматаар үүсгэнэ (хуучин бүртгэл / шууд DB-д нэмсэн
    // хэрэглэгч дашбордоос гарч хаягдахгүйн тулд).
    if (user.role === 'student') {
      let sr = await pool.query('SELECT id FROM students WHERE user_id = $1', [user.id]);
      if (sr.rows.length === 0) {
        sr = await pool.query('INSERT INTO students (user_id) VALUES ($1) RETURNING id', [user.id]);
      }
      studentId = sr.rows[0]?.id || null;
    } else if (user.role === 'teacher') {
      let tr = await pool.query('SELECT id FROM teachers WHERE user_id = $1', [user.id]);
      if (tr.rows.length === 0) {
        tr = await pool.query(
          `INSERT INTO teachers (user_id, specialties, experience_years, hourly_rate)
           VALUES ($1, '{}', 0, 0)
           RETURNING id`,
          [user.id]
        );
      }
      teacherId = tr.rows[0]?.id || null;
    } else if (user.role === 'parent') {
      const pr = await pool.query('SELECT id FROM parents WHERE user_id = $1', [user.id]);
      if (pr.rows.length === 0) {
        await pool.query('INSERT INTO parents (user_id) VALUES ($1)', [user.id]);
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        createdAt: user.created_at,
        studentId,
        teacherId
      }
    });

  } catch (error) {
    next(error);
  }
};
