import pool from '../config/database.js';

// students.current_level багана одоо "Шалгалтын тэмдэглэл" (чөлөөт текст) хадгалдаг
// болсон тул VARCHAR(100)-с TEXT рүү өргөтгөнө.
async function migrate() {
  try {
    console.log('🔄 students.current_level -> TEXT болгож байна...');

    await pool.query(`
      ALTER TABLE students ALTER COLUMN current_level TYPE TEXT;
    `);

    console.log('✅ Шинэчлэгдлээ!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migrate();
