import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL холболтын тохиргоо
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pi_too',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // максимум холболтын тоо
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Холболт амжилттай эсэхийг шалгах
pool.on('connect', () => {
  console.log('✅ PostgreSQL-д амжилттай холбогдлоо');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL холболтын алдаа:', err);
  process.exit(-1);
});

// Query хийх helper function
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query алдаа:', error);
    throw error;
  }
};

// Transaction эхлүүлэх
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Timeout тохируулах
  const timeout = setTimeout(() => {
    console.error('Client холболт timeout болсон');
    client.release();
  }, 5000);

  client.query = (...args) => {
    clearTimeout(timeout);
    return query(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    return release();
  };

  return client;
};

export default pool;
