import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_NAME = process.env.DB_NAME || 'pi_too';

// "pi_too" өгөгдлийн сан байхгүй бол postgres дээр холбогдож үүсгэнэ
async function ensureDatabase() {
  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);

  if (rows.length === 0) {
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`  ✅ "${DB_NAME}" өгөгдлийн сан үүсгэгдлээ`);
  } else {
    console.log(`  ✅ "${DB_NAME}" өгөгдлийн сан аль хэдийн байна`);
  }

  await client.end();
}

// Дэд скрипт ажиллуулж, аль хэдийн хийгдсэн байвал алдааг зөөлөн алгасна
function step(label, script) {
  console.log(`\n▶ ${label}`);
  try {
    execSync(`"${process.execPath}" "${path.join(__dirname, script)}"`, { stdio: 'inherit' });
  } catch {
    console.log(`  ⚠ ${label} — алгасав (магадгүй аль хэдийн хийгдсэн)`);
  }
}

async function main() {
  console.log('🚀 Пи тоо backend — нэг товчийн тохиргоо\n');

  try {
    console.log('▶ Өгөгдлийн сан шалгах / үүсгэх');
    await ensureDatabase();
  } catch (err) {
    console.error('\n❌ PostgreSQL-д холбогдож чадсангүй.');
    if (err.code === '28P01') console.error('   → .env доторх DB_PASSWORD буруу байна.');
    else if (err.code === 'ECONNREFUSED') console.error('   → PostgreSQL асаагүй байна.');
    else console.error('   →', err.message);
    process.exit(1);
  }

  step('Хүснэгт үүсгэх (migrate)', 'migrate.js');
  step('Жишээ өгөгдөл (seed)', 'seed.js');
  step('Демо хичээлүүд (seed-lessons)', 'seed-lessons.js');

  console.log('\n✅ Тохиргоо дууслаа. Одоо серверээ асаа:  npm run dev');
  process.exit(0);
}

main();
