import bcrypt from 'bcrypt';
import pool from '../config/database.js';

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Жишээ өгөгдөл оруулж байна...');

    // 1. Салбарууд
    const branchesResult = await client.query(`
      INSERT INTO branches (name, address, district, phone, opening_hours)
      VALUES 
        ('УБ Төв', 'Сүхбаатар дүүрэг, 1-р хороо', 'Сүхбаатар', '77111234', '08:00 - 21:00'),
        ('Хан-Уул', 'Зайсан', 'Хан-Уул', '77113456', '08:00 - 20:00'),
        ('Баянзүрх', '13-р хороолол', 'Баянзүрх', '77115678', '08:00 - 20:00'),
        ('Сүхбаатар', '1-р хороо', 'Сүхбаатар', '77119999', '08:00 - 20:00')
      RETURNING id
    `);
    console.log('✅ Салбарууд нэмэгдлээ');

    // 2. Тасалгаанууд
    await client.query(`
      INSERT INTO rooms (branch_id, room_number, capacity, floor)
      VALUES 
        (1, '201', 6, 2),
        (1, '203', 6, 2),
        (1, '305', 4, 3),
        (2, '101', 6, 1),
        (3, '202', 6, 2)
    `);
    console.log('✅ Тасалгаанууд нэмэгдлээ');

    // 3. Хэрэглэгчид (багш нар)
    const hashedPassword = await bcrypt.hash('password123', 10);

    const teacherUsers = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
      VALUES 
        ('baysgalan@pitoo.mn', $1, 'teacher', 'Баясгалан', 'А.', '99110001'),
        ('amirlangui@pitoo.mn', $1, 'teacher', 'Амирлангуй', '', '99110002'),
        ('enkhbileg@pitoo.mn', $1, 'teacher', 'Энхбилэг', 'Ч.', '99110003'),
        ('oyungerel@pitoo.mn', $1, 'teacher', 'Оюунгэрэл', 'Н.', '99110004'),
        ('enkhtuyaa@pitoo.mn', $1, 'teacher', 'Энхтуяа', 'Г.', '99110005')
      RETURNING id
    `, [hashedPassword]);
    console.log('✅ Багш хэрэглэгчид нэмэгдлээ');

    // 4. Багш нарын дэлгэрэнгүй мэдээлэл (branch_id: 1=УБ Төв, 2=Хан-Уул, 3=Баянзүрх, 4=Сүхбаатар)
    const teacherIds = teacherUsers.rows.map(r => r.id);
    await client.query(`
      INSERT INTO teachers (user_id, branch_id, specialties, experience_years, rating, hourly_rate, bio, photo_url)
      VALUES
        ($1, 1, ARRAY['Математик', 'Олон улсын математик'], 4.0, 4.9, 6000, 'Олон улсын математикийн багш', '/assets/images/teachers/baysgalan.png'),
        ($2, 2, ARRAY['Монгол математик'], 0.5, 4.8, 5500, 'Монгол хөтөлбөрийн математик', '/assets/images/teachers/amirlangui.jpg'),
        ($3, 3, ARRAY['Математик'], 1.0, 4.7, 5000, 'Математикийн багш', '/assets/images/teachers/enkhbileg.jpg'),
        ($4, 1, ARRAY['ЭЕШ', 'Олимпиад'], 6.0, 5.0, 6500, 'ЭЕШ болон олимпиадын багш', '/assets/images/teachers/oyungerel.jpg'),
        ($5, 4, ARRAY['Математик'], 2.0, 4.6, 5000, 'Математикийн багш', '/assets/images/teachers/enkhtuyaa.jpg')
    `, teacherIds);
    console.log('✅ Багш нарын мэдээлэл нэмэгдлээ');

    // 5. Жишээ сурагч
    const studentUser = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
      VALUES ('temuulen@example.com', $1, 'student', 'Тэмүүлэн', 'А.', '99887766')
      RETURNING id
    `, [hashedPassword]);

    await client.query(`
      INSERT INTO students (user_id, age, grade, school, current_level, goals, qr_code)
      VALUES ($1, 16, '10-р анги', 'Шинэ эрин', 'Дунд', ARRAY['ЭЕШ бэлтгэл', 'Дүн сайжруулах'], 'QR_STUDENT_001')
    `, [studentUser.rows[0].id]);
    console.log('✅ Жишээ сурагч нэмэгдлээ');

    // 6. Жишээ эцэг эх
    const parentUser = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
      VALUES ('batbayar@example.com', $1, 'parent', 'Батбаяр', 'Б.', '99112233')
      RETURNING id
    `, [hashedPassword]);

    await client.query(`
      INSERT INTO parents (user_id) VALUES ($1)
    `, [parentUser.rows[0].id]);
    console.log('✅ Жишээ эцэг эх нэмэгдлээ');

    await client.query('COMMIT');
    console.log('✅ Бүх өгөгдөл амжилттай нэмэгдлээ!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed алдаа:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
