import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('🔄 Өгөгдлийн сангийн migration эхэллээ...');

    // schema.sql файлыг уншина
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // SQL командуудыг ажиллуулна
    await pool.query(schema);

    console.log('✅ Migration амжилттай дууслаа!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migrate();
