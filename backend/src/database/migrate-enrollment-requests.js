import pool from '../config/database.js';

/**
 * enrollment_requests — бүртгэлийн wizard-ийн эцсийн үр дүн.
 * payment.html дээр "Төлбөр төлөх" дарахад эцэг эх, сурагч, сонгосон багш,
 * хуваарийн мэдээллийг нэг мөр болгон хадгална. Ажилтан гараар баталгаажуулна
 * (contact_requests / assessment_requests-тэй ижил зарчим).
 *
 * Ажиллуулах:  node src/database/migrate-enrollment-requests.js
 *              (эсвэл npm run db:migrate-enrollment)
 *
 * Давхар ажиллуулахад аюулгүй (idempotent).
 */
async function migrate() {
  try {
    console.log('🔄 enrollment_requests хүснэгт шалгаж байна...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollment_requests (
        id SERIAL PRIMARY KEY,
        branch_id INTEGER REFERENCES branches(id),
        teacher_id INTEGER REFERENCES teachers(id),
        availability_id INTEGER REFERENCES teacher_availability(id),

        parent_name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_email VARCHAR(255),

        student_name VARCHAR(255) NOT NULL,
        student_age INTEGER,
        student_grade VARCHAR(50),
        student_school VARCHAR(255),
        student_level VARCHAR(50),
        goals TEXT[],

        day_of_week INTEGER,
        start_time TIME,
        end_time TIME,
        subject VARCHAR(255),

        package_hours INTEGER NOT NULL DEFAULT 75,
        amount INTEGER NOT NULL DEFAULT 450000,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_enrollment_requests_teacher_id
        ON enrollment_requests(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status
        ON enrollment_requests(status);
    `);

    console.log('✅ enrollment_requests бэлэн');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migrate();
