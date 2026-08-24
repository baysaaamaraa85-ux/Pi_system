import bcrypt from 'bcrypt';
import pool from '../config/database.js';

// Жишээ хичээл + суудлын дүүргэлт үүсгэх нэг удаагийн скрипт
// БҮХ багшид (1-5) ирэх 7 хоногийн турш өдөр бүр өглөө/өдөр/оройн 2 цагийн 3 хичээл
// үүсгэнэ — бодит долоо хоногийн хуваарь шиг дүүрэн харагдана, сул/дүүрсэн холилдоно.
async function run() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Демо болгож нийт 6 сурагч хэрэгтэй тул дутуу байвал нэмж үүсгэнэ
    const existing = await client.query('SELECT id FROM students ORDER BY id');
    let studentIds = existing.rows.map((r) => r.id);

    if (studentIds.length < 6) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const namesNeeded = 6 - studentIds.length;

      for (let i = 0; i < namesNeeded; i++) {
        const name = `Демо сурагч ${i + 1}`;
        const email = `demo.student${Date.now()}${i}@pitoo.mn`;

        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
           VALUES ($1, $2, 'student', $3, '', '9900000${i}')
           RETURNING id`,
          [email, hashedPassword, name]
        );

        const studentResult = await client.query(
          `INSERT INTO students (user_id, age, grade)
           VALUES ($1, 14, '8-р анги')
           RETURNING id`,
          [userResult.rows[0].id]
        );

        studentIds.push(studentResult.rows[0].id);
      }
    }

    // Тестээс үлдсэн хуучин demo lesson/enrollment-уудыг цэвэрлээд бүх багшид дахин үүсгэнэ
    await client.query(`DELETE FROM lesson_enrollments WHERE lesson_id IN (SELECT id FROM lessons WHERE notes = 'demo-seed')`);
    await client.query(`DELETE FROM lessons WHERE notes = 'demo-seed'`);

    const inDays = (days, hour) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };

    // Багш бүрийн голлон ажилладаг салбарт байгаа өрөө (жинхэнэ биш, зөвхөн демо зорилготой)
    const roomByTeacher = { 1: 1, 2: 4, 3: 5, 4: 1, 5: 1 };

    // Багш бүрийн зааж буй эхний хичээл — хичээлийн нэрэнд ашиглана
    const teachersResult = await client.query('SELECT id, specialties FROM teachers ORDER BY id');
    const subjectByTeacher = {};
    teachersResult.rows.forEach((t) => {
      subjectByTeacher[t.id] = (t.specialties && t.specialties[0]) || 'Математик';
    });

    // Өдрийн 3 цаг: өглөө/өдөр/орой — тус бүр 2 цагаар (жишээ нь 09:00-11:00)
    const DAILY_SLOTS = [
      { hour: 9, label: 'өглөө' },
      { hour: 14, label: 'өдөр' },
      { hour: 17, label: 'орой' },
    ];

    let created = 0;

    for (let teacherId = 1; teacherId <= 5; teacherId++) {
      const roomId = roomByTeacher[teacherId];
      const subject = subjectByTeacher[teacherId] || 'Математик';

      // Ирэх 7 хоног — өдөр бүр 3 цагийн хичээлтэй (долоо хоногийн бүх өдөр багана дүүрнэ)
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        for (let slotIndex = 0; slotIndex < DAILY_SLOTS.length; slotIndex++) {
          const slot = DAILY_SLOTS[slotIndex];

          // Дүүргэлтийг холилдуулна: заримыг сул, заримыг бараг дүүрсэн, заримыг дүүрсэн (6/6)
          const enrollCount = (dayOffset + slotIndex * 2 + teacherId) % 7; // 0..6

          const lessonResult = await client.query(
            `INSERT INTO lessons (teacher_id, room_id, subject, start_time, end_time, max_students, status, notes)
             VALUES ($1, $2, $3, $4, $5, 6, 'scheduled', 'demo-seed')
             RETURNING id`,
            [
              teacherId,
              roomId,
              subject,
              inDays(dayOffset, slot.hour),
              inDays(dayOffset, slot.hour + 2),
            ]
          );

          const lessonId = lessonResult.rows[0].id;
          created++;

          const enrolledStudents = studentIds.slice(0, enrollCount);

          for (const studentId of enrolledStudents) {
            await client.query(
              `INSERT INTO lesson_enrollments (lesson_id, student_id) VALUES ($1, $2)
               ON CONFLICT (lesson_id, student_id) DO NOTHING`,
              [lessonId, studentId]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Бүх 5 багшид ${created} демо хичээл (7 хоног x өглөө/өдөр/орой), суудлын дүүргэлттэйгээр үүслээ!`);
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Алдаа:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
