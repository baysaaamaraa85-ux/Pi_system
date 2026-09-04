import bcrypt from 'bcrypt';
import pool from '../config/database.js';

// ─────────────────────────────────────────────────────────────
// Демо өгөгдөл — багийн гишүүд бүгд ижил зүйл харахын тулд.
//   npm run db:seed-demo
// Дахин дахин ажиллуулж болно (idempotent). Бүх аккаунтын нууц үг: test123456
//   admin@gmail.com     — админ хяналтын самбар
//   student@gmail.com   — сурагч (Тэмүүлэн), 45/75 цаг
//   student2@gmail.com  — сурагч (Сарнай), 30/75 цаг
//   parent@gmail.com    — эцэг эх (Болормаа), хүүхэд = Сарнай
// Багш: seed-teachers-ийн oyungerel@pitoo.mn / password123 (байхгүй бол шинээр)
// ─────────────────────────────────────────────────────────────

const PW = 'test123456';
const MARK = 'demo-seed';

const inDays = (days, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

async function run() {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const hash = await bcrypt.hash(PW, 10);

    // ── цэвэрлэгээ (өмнөх демо ажиллуулалт) ──
    await c.query(`DELETE FROM attendance WHERE lesson_id IN (SELECT id FROM lessons WHERE notes = $1)`, [MARK]);
    await c.query(`DELETE FROM lesson_enrollments WHERE lesson_id IN (SELECT id FROM lessons WHERE notes = $1)`, [MARK]);
    await c.query(`DELETE FROM lessons WHERE notes = $1`, [MARK]);
    await c.query(`DELETE FROM enrollment_requests WHERE student_name = 'Демо хүсэлт'`);

    // ── хэрэглэгч upsert ──
    async function upsertUser(email, role, firstName, lastName = '', phone = null) {
      const found = await c.query('SELECT id FROM users WHERE email = $1', [email]);
      if (found.rows.length) {
        await c.query(
          `UPDATE users SET password_hash = $1, role = $2, first_name = $3, last_name = $4, phone = COALESCE($5, phone) WHERE id = $6`,
          [hash, role, firstName, lastName, phone, found.rows[0].id]
        );
        return found.rows[0].id;
      }
      const ins = await c.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [email, hash, role, firstName, lastName, phone]
      );
      return ins.rows[0].id;
    }

    async function ensureStudent(userId, { grade, school, completed, leaves, parentId = null }) {
      const found = await c.query('SELECT id FROM students WHERE user_id = $1', [userId]);
      if (found.rows.length) {
        await c.query(
          `UPDATE students SET grade = $1, school = $2, total_hours = 75, completed_hours = $3, remaining_leaves = $4, parent_id = $5 WHERE id = $6`,
          [grade, school, completed, leaves, parentId, found.rows[0].id]
        );
        return found.rows[0].id;
      }
      const ins = await c.query(
        `INSERT INTO students (user_id, parent_id, grade, school, total_hours, completed_hours, remaining_leaves)
         VALUES ($1, $2, $3, $4, 75, $5, $6) RETURNING id`,
        [userId, parentId, grade, school, completed, leaves]
      );
      return ins.rows[0].id;
    }

    // ── админ ──
    await upsertUser('admin@gmail.com', 'admin', 'Админ');

    // ── эцэг эх ──
    const parentUserId = await upsertUser('parent@gmail.com', 'parent', 'Болормаа', '', '99001122');
    if (!(await c.query('SELECT 1 FROM parents WHERE user_id = $1', [parentUserId])).rows.length) {
      await c.query('INSERT INTO parents (user_id) VALUES ($1)', [parentUserId]);
    }

    // ── сурагчид ──
    const s1User = await upsertUser('student@gmail.com', 'student', 'Тэмүүлэн', '', '99110045');
    const s1 = await ensureStudent(s1User, { grade: '10', school: '1-р сургууль', completed: 45, leaves: 3 });

    const s2User = await upsertUser('student2@gmail.com', 'student', 'Сарнай', '', '99110046');
    const s2 = await ensureStudent(s2User, { grade: '7', school: '11-р сургууль', completed: 30, leaves: 4, parentId: parentUserId });

    // ── багш (seed-teachers-ээс, эсвэл шинээр) ──
    let t = await c.query(`SELECT id FROM teachers WHERE user_id = (SELECT id FROM users WHERE email = 'oyungerel@pitoo.mn')`);
    let teacherId = t.rows[0]?.id;
    if (!teacherId) {
      t = await c.query('SELECT id FROM teachers WHERE is_active LIMIT 1');
      teacherId = t.rows[0]?.id;
    }
    if (!teacherId) {
      const tu = await upsertUser('oyungerel@pitoo.mn', 'teacher', 'Н.Оюунгэрэл');
      await c.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash('password123', 10), tu]);
      const ti = await c.query(
        `INSERT INTO teachers (user_id, specialties, experience_years, hourly_rate, bio, branch_id, is_active)
         VALUES ($1, '{"ЭЕШ","Олимпиад"}', 6, 6500, 'Демо багш', 1, true) RETURNING id`,
        [tu]
      );
      teacherId = ti.rows[0].id;
    }

    // ── өрөө ──
    let room = await c.query(`SELECT id FROM rooms WHERE room_number = '203' AND branch_id = 1`);
    if (!room.rows.length) {
      const anyBranch = await c.query('SELECT id FROM branches ORDER BY id LIMIT 1');
      const branchId = anyBranch.rows[0]?.id || 1;
      room = await c.query(
        `INSERT INTO rooms (branch_id, room_number, capacity, floor) VALUES ($1, '203', 8, 2) RETURNING id`,
        [branchId]
      );
    }
    const roomId = room.rows[0].id;

    // ── хичээл + ирц (сурагч бүрд) ──
    const plan = [
      [-26, 'present'], [-24, 'present'], [-21, 'excused'], [-19, 'present'], [-16, 'present'],
      [-14, 'present'], [-12, 'late'], [-9, 'absent'], [-6, 'present'], [-3, 'present'],
      [2, null], [6, null],
    ];
    let lessonCount = 0;
    for (const studentId of [s1, s2]) {
      for (const [day, att] of plan) {
        const l = await c.query(
          `INSERT INTO lessons (teacher_id, room_id, subject, start_time, end_time, max_students, status, notes)
           VALUES ($1, $2, 'Математик', $3, $4, 6, $5, $6) RETURNING id`,
          [teacherId, roomId, inDays(day, 8), inDays(day, 11), att ? 'completed' : 'scheduled', MARK]
        );
        await c.query('INSERT INTO lesson_enrollments (lesson_id, student_id) VALUES ($1, $2)', [l.rows[0].id, studentId]);
        if (att) {
          await c.query(
            `INSERT INTO attendance (lesson_id, student_id, status, checked_in_at)
             VALUES ($1, $2, $3, $4)`,
            [l.rows[0].id, studentId, att, att === 'absent' ? null : inDays(day, 8)]
          );
        }
        lessonCount++;
      }
    }

    // ── бүртгэлийн хүсэлтүүд (админ самбарын график/орлогод) ──
    const anyBranch = (await c.query('SELECT id FROM branches ORDER BY id LIMIT 1')).rows[0]?.id || 1;
    const reqStatuses = ['confirmed', 'confirmed', 'pending', 'pending', 'cancelled'];
    for (const st of reqStatuses) {
      await c.query(
        `INSERT INTO enrollment_requests
          (branch_id, teacher_id, parent_name, parent_phone, student_name, student_grade,
           day_of_week, start_time, end_time, subject, package_hours, amount, status)
         VALUES ($1, $2, 'Демо эцэг эх', '99000000', 'Демо хүсэлт', '8',
           1, '08:00', '11:00', 'Математик', 75, 450000, $3)`,
        [anyBranch, teacherId, st]
      );
    }

    await c.query('COMMIT');
    console.log(`✅ Демо өгөгдөл бэлэн:
   admin@gmail.com / ${PW}     → админ самбар
   student@gmail.com / ${PW}   → сурагч (Тэмүүлэн)
   student2@gmail.com / ${PW}  → сурагч (Сарнай)
   parent@gmail.com / ${PW}    → эцэг эх (Болормаа)
   oyungerel@pitoo.mn / password123 → багш
   ${lessonCount} хичээл, ирцийн түүх, 5 бүртгэлийн хүсэлт үүслээ.`);
    process.exit(0);
  } catch (err) {
    await c.query('ROLLBACK');
    console.error('❌ Алдаа:', err);
    process.exit(1);
  } finally {
    c.release();
  }
}

run();
