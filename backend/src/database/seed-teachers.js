import bcrypt from 'bcrypt';
import pool from '../config/database.js';

/**
 * Багш нарын жагсаалтыг нүүр хуудасны "Багш нар" хэсэгтэй (a/assets/data/home.json)
 * яг тааруулна. teacher-select.html, teachers.html, teacher-detail.html бүгд
 * өгөгдлийн сангаас уншдаг тул энэ script ажилласнаар бүх хэсэгт ижил багш нар харагдана.
 *
 * Ажиллуулах:  node src/database/seed-teachers.js   (эсвэл npm run db:seed-teachers)
 *
 * Одоо байгаа teachers мөрүүдийг ДАРААЛЛААР нь шинэчилнэ (устгахгүй) —
 * лидлэг цөөн бол шинээр нэмнэ, илүү бол idэвхгүй болгоно.
 */

// branch_id: 1=УБ Төв, 2=Баянзүрх, 3=Сүхбаатар, 4=Хан-Уул
const TEACHERS = [
  {
    firstName: 'А.Баясгалан',
    branchId: 1,
    specialties: ['AS & A Level', 'IGCSE', 'IB'],
    experienceYears: 4,
    rating: 3.9,
    hourlyRate: 6000,
    bio: 'Олон улсын хөтөлбөрийн (Cambridge, IB) математикийн багш.',
    photoUrl: '/assets/images/teachers/baysgalan.png',
  },
  {
    firstName: 'Амирлангуй',
    branchId: 1,
    specialties: ['ЭЕШ бэлтгэл', 'Олимпиадын бэлтгэл'],
    experienceYears: 0.5,
    rating: 4.8,
    hourlyRate: 5500,
    bio: 'ЭЕШ болон олимпиадын бэлтгэлийн математикийн багш.',
    photoUrl: '/assets/images/teachers/amirlangui.jpg',
  },
  {
    firstName: 'Ч.Энхбилэг',
    branchId: 2,
    specialties: ['Түвшин ахиулах', 'Хоцрогдол арилгах'],
    experienceYears: 1,
    rating: 4.7,
    hourlyRate: 5000,
    bio: 'Түвшин ахиулах, хоцрогдол арилгах чиглэлийн математикийн багш.',
    photoUrl: '/assets/images/teachers/enkhbileg.jpg',
  },
  {
    firstName: 'Н.Оюунгэрэл',
    branchId: 3,
    specialties: ['ЭЕШ', 'Олимпиад'],
    experienceYears: 6,
    rating: 5.0,
    hourlyRate: 6500,
    bio: 'ЭЕШ болон олимпиадад амжилттай бэлтгэсэн туршлагатай багш.',
    photoUrl: '/assets/images/teachers/oyungerel.jpg',
  },
  {
    firstName: 'Г.Энхтуяа',
    branchId: 4,
    specialties: ['Математик'],
    experienceYears: 2,
    rating: 1.6,
    hourlyRate: 5000,
    bio: 'Ерөнхий боловсролын математикийн багш.',
    photoUrl: '/assets/images/teachers/enkhtuyaa.jpg',
  },
];

async function seedTeachers() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = (
      await client.query('SELECT id, user_id FROM teachers ORDER BY id')
    ).rows;

    const hashedPassword = await bcrypt.hash('password123', 10);
    const usedIds = [];

    for (let i = 0; i < TEACHERS.length; i++) {
      const t = TEACHERS[i];

      if (i < existing.length) {
        // Байгаа мөрийг шинэчлэх
        const { id, user_id } = existing[i];

        await client.query(
          `UPDATE users SET first_name = $1, last_name = '' WHERE id = $2`,
          [t.firstName, user_id],
        );

        await client.query(
          `UPDATE teachers
           SET branch_id = $1, specialties = $2, experience_years = $3, rating = $4,
               hourly_rate = $5, bio = $6, photo_url = $7, is_active = true
           WHERE id = $8`,
          [t.branchId, t.specialties, t.experienceYears, t.rating, t.hourlyRate, t.bio, t.photoUrl, id],
        );

        usedIds.push(id);
      } else {
        // Дутуу бол шинээр нэмэх
        const email = `teacher${Date.now()}_${i}@pitoo.mn`;
        const userRow = await client.query(
          `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
           VALUES ($1, $2, 'teacher', $3, '', $4) RETURNING id`,
          [email, hashedPassword, t.firstName, `9911${String(1000 + i)}`],
        );

        const teacherRow = await client.query(
          `INSERT INTO teachers (user_id, branch_id, specialties, experience_years, rating, hourly_rate, bio, photo_url, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING id`,
          [
            userRow.rows[0].id,
            t.branchId,
            t.specialties,
            t.experienceYears,
            t.rating,
            t.hourlyRate,
            t.bio,
            t.photoUrl,
          ],
        );

        usedIds.push(teacherRow.rows[0].id);
      }
    }

    // Илүү багш нарыг жагсаалтаас нуух
    const leftover = existing.slice(TEACHERS.length).map((r) => r.id);
    if (leftover.length) {
      await client.query(
        `UPDATE teachers SET is_active = false WHERE id = ANY($1::int[])`,
        [leftover],
      );
    }

    await client.query('COMMIT');

    console.log('✅ Багш нар нүүр хуудасны жагсаалттай тааруулагдлаа.');
    console.log('   Идэвхтэй багш ID-ууд:', usedIds.join(', '));
    if (leftover.length) console.log('   Идэвхгүй болгосон:', leftover.join(', '));
    console.log('\n   home.json дахь "teachers[].id"-г дараах дараалалд тааруул:', usedIds.join(', '));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Алдаа:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTeachers();
