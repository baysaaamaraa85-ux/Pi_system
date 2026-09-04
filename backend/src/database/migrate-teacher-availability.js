import pool from '../config/database.js';

/**
 * teacher_availability — багшийн 7 хоногийн давтагдах "нээлттэй цаг"-ийн хүснэгт.
 * schedule-select.html эндээс уншиж, эцэг эх нэг цагийг сонгодог.
 *
 * Ажиллуулах:  node src/database/migrate-teacher-availability.js
 *              (эсвэл npm run db:migrate-availability)
 *
 * Хүснэгт байхгүй бол үүсгэнэ. Нээлттэй цаггүй идэвхтэй багш бүрд жишээ цаг нэмнэ.
 * Давхар ажиллуулахад аюулгүй (idempotent) — цаг нэгэнт байгаа багшийг алгасна.
 */

// day_of_week: 0=Ням, 1=Даваа ... 6=Бямба (JS Date.getDay()-тэй ижил)
const WEEKDAYS = [1, 2, 3, 4, 5];
const HOUR_POOL = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Багш бүрд өөр өөр цагийн хослол өгөхийн тулд index дээр тулгуурлан сонгоно
function buildSlotsForTeacher(index) {
  const slots = [];
  // Долоо хоногийн 3–5 өдөр, өдөрт 2 цаг
  const dayCount = 3 + (index % 3); // 3..5
  for (let d = 0; d < dayCount; d++) {
    const day = WEEKDAYS[(index + d) % WEEKDAYS.length];
    const h1 = HOUR_POOL[(index + d) % HOUR_POOL.length];
    const h2 = HOUR_POOL[(index + d + 3) % HOUR_POOL.length];
    for (const start of new Set([h1, h2])) {
      const end = `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00`;
      slots.push({ day, start, end });
    }
  }
  return slots;
}

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 teacher_availability хүснэгт шалгаж байна...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_availability (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        subject VARCHAR(255),
        max_students INTEGER NOT NULL DEFAULT 6 CHECK (max_students > 0),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT teacher_availability_time_check CHECK (end_time > start_time),
        CONSTRAINT teacher_availability_unique_slot
          UNIQUE (teacher_id, day_of_week, start_time, end_time)
      );

      CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id
        ON teacher_availability(teacher_id);
    `);
    console.log('✅ Хүснэгт бэлэн');

    const { rows: teachers } = await client.query(
      'SELECT id FROM teachers WHERE is_active = true ORDER BY id'
    );

    if (teachers.length === 0) {
      console.log('⚠️  Идэвхтэй багш алга — эхлээд npm run db:seed ажиллуул.');
      return;
    }

    let insertedTeachers = 0;
    let insertedSlots = 0;

    for (let i = 0; i < teachers.length; i++) {
      const teacherId = teachers[i].id;

      const { rows: existing } = await client.query(
        'SELECT COUNT(*)::int AS n FROM teacher_availability WHERE teacher_id = $1 AND is_active = true',
        [teacherId]
      );
      if (existing[0].n > 0) continue;

      for (const s of buildSlotsForTeacher(i)) {
        const result = await client.query(
          `INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (teacher_id, day_of_week, start_time, end_time) DO NOTHING`,
          [teacherId, s.day, s.start, s.end]
        );
        insertedSlots += result.rowCount;
      }
      insertedTeachers++;
    }

    if (insertedTeachers === 0) {
      console.log('ℹ️  Бүх идэвхтэй багш нээлттэй цагтай байна — seed алгасав.');
    } else {
      console.log(`✅ ${insertedTeachers} багшид нийт ${insertedSlots} нээлттэй цаг нэмэгдлээ.`);
    }
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
