import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function checkDatabase() {
  // Эхлээд postgres database-д холбогдож pi_too байгаа эсэхийг шалгах
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Default database
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL-д амжилттай холбогдлоо');

    // pi_too database байгаа эсэхийг шалгах
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'pi_too'"
    );

    if (result.rows.length === 0) {
      console.log('⚠️  pi_too өгөгдлийн сан байхгүй байна');
      console.log('📝 Үүсгэж байна...');
      
      await client.query('CREATE DATABASE pi_too');
      console.log('✅ pi_too өгөгдлийн сан үүсгэгдлээ!');
    } else {
      console.log('✅ pi_too өгөгдлийн сан аль хэдийн байна');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Алдаа:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n💡 Нууц үг буруу байна. .env файлд зөв нууц үг оруулна уу:');
      console.log('   DB_PASSWORD=your_actual_password');
    }
    
    process.exit(1);
  }
}

checkDatabase();
