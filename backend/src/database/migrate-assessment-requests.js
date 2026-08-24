import pool from '../config/database.js';

// Аль хэдийн үүссэн pi_too database-ийг зассан schema-той тааруулах нэг удаагийн patch.
async function migrate() {
  try {
    console.log('🔄 assessment_requests хүснэгт үүсгэж байна...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_requests (
        id SERIAL PRIMARY KEY,
        branch_id INTEGER REFERENCES branches(id),
        phone VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_assessment_requests_branch_id ON assessment_requests(branch_id);
    `);

    console.log('✅ Шинэчлэгдлээ!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migrate();
