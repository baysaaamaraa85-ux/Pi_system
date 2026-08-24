import pool from '../config/database.js';

// Аль хэдийн үүссэн pi_too database-ийг зассан schema-той тааруулах нэг удаагийн patch:
// teachers.branch_id + contact_requests хүснэгт нэмнэ.
async function migrate() {
  try {
    console.log('🔄 teachers.branch_id, contact_requests шинэчилж байна...');

    await pool.query(`
      ALTER TABLE teachers ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

      CREATE TABLE IF NOT EXISTS contact_requests (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        parent_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        program VARCHAR(255),
        message TEXT,
        sms_status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_teachers_branch_id ON teachers(branch_id);
      CREATE INDEX IF NOT EXISTS idx_contact_requests_teacher_id ON contact_requests(teacher_id);
    `);

    console.log('✅ Шинэчлэгдлээ!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migrate();
