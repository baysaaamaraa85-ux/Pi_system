import pool from '../config/database.js';

// Аль хэдийн үүссэн pi_too database-ийг зассан schema-той тааруулах нэг удаагийн patch.
async function migrate() {
  try {
    console.log('🔄 study_inquiries хүснэгт үүсгэж байна...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_inquiries (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        school VARCHAR(255),
        grade VARCHAR(20),
        phone VARCHAR(20) NOT NULL,
        program_interest VARCHAR(255),
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Шинэчлэгдлээ!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migrate();
