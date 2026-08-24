import pool from '../config/database.js';

// schema.sql зөвхөн шинэ (хоосон) database дээр л ажилладаг тул
// аль хэдийн үүссэн pi_too database-ийг зассан schema-той тааруулах нэг удаагийн patch.
async function migratePayments() {
  try {
    console.log('🔄 payments хүснэгтийг шинэчилж байна...');

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE program_type_enum AS ENUM ('international', 'mongolian');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE billing_type_enum AS ENUM ('package', 'hourly');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_method_enum AS ENUM ('qpay', 'bank_transfer');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS program_type program_type_enum NOT NULL DEFAULT 'mongolian',
        ADD COLUMN IF NOT EXISTS billing_type billing_type_enum NOT NULL DEFAULT 'package',
        ADD COLUMN IF NOT EXISTS payment_method payment_method_enum;

      ALTER TABLE payments ALTER COLUMN program_type DROP DEFAULT;
      ALTER TABLE payments ALTER COLUMN amount DROP NOT NULL;
      ALTER TABLE payments ALTER COLUMN package_hours DROP NOT NULL;
    `);

    console.log('✅ payments хүснэгт шинэчлэгдлээ!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration алдаа:', error);
    process.exit(1);
  }
}

migratePayments();
