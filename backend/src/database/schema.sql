-- Пи тоо өгөгдлийн сангийн бүтэц

-- Хэрэглэгчийн төрөл
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parent', 'admin');

-- Хичээлийн төлөв
CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Төлбөрийн төлөв
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Хөтөлбөрийн төрөл
CREATE TYPE program_type_enum AS ENUM ('international', 'mongolian');

-- Төлбөрийн хэлбэр (75 цагийн багц эсвэл цагаар)
CREATE TYPE billing_type_enum AS ENUM ('package', 'hourly');

-- Төлбөр хийх арга
CREATE TYPE payment_method_enum AS ENUM ('qpay', 'bank_transfer');

-- Чөлөөний хүсэлтийн төлөв
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- ХЭРЭГЛЭГЧИД
-- ============================================

-- Хэрэглэгчийн үндсэн хүснэгт
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сурагчид
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES users(id),
  age INTEGER,
  grade VARCHAR(20),
  school VARCHAR(255),
  current_level TEXT,
  goals TEXT[],
  total_hours INTEGER DEFAULT 75,
  completed_hours DECIMAL(5,2) DEFAULT 0,
  remaining_leaves INTEGER DEFAULT 5,
  qr_code VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Багш нар
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  specialties TEXT[] NOT NULL,
  experience_years DECIMAL(3,1) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  hourly_rate INTEGER NOT NULL,
  bio TEXT,
  photo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Эцэг эх
CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- САЛБАР & ХУВААРЬ
-- ============================================

-- Салбарууд
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  district VARCHAR(100),
  phone VARCHAR(20),
  opening_hours VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Багш аль салбарт голлон ажилладагийг холбох
ALTER TABLE teachers ADD COLUMN branch_id INTEGER REFERENCES branches(id);

-- Тасалгаа
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  capacity INTEGER NOT NULL,
  floor INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Хичээлийн хуваарь
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id),
  subject VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_students INTEGER DEFAULT 6,
  status lesson_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Хичээлд бүртгэгдсэн сурагчид
CREATE TABLE lesson_enrollments (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lesson_id, student_id)
);

-- ============================================
-- ИРЦ
-- ============================================

-- Ирцийн бүртгэл
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'present', -- present, absent, late
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lesson_id, student_id)
);

-- Чөлөөний хүсэлт
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status leave_status DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id)
);

-- ============================================
-- ТӨЛБӨР
-- ============================================

-- Төлбөрийн бүртгэл
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  program_type program_type_enum NOT NULL,
  billing_type billing_type_enum NOT NULL DEFAULT 'package',
  payment_method payment_method_enum,
  amount INTEGER,
  package_hours INTEGER,
  status payment_status DEFAULT 'pending',
  qpay_invoice_id VARCHAR(255),
  qpay_qr_text TEXT,
  qpay_qr_image TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ҮНЭЛГЭЭ & МЭДЭГДЭЛ
-- ============================================

-- Багшийн үнэлгээ
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, student_id)
);

-- Түвшин тогтоох цаг захиалах хүсэлт (нүүр хуудасны "Бүртгүүлэх" 01 карт)
CREATE TABLE assessment_requests (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id),
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, contacted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- "Суралцах эхний алхмаа хийе" хуудасны хүсэлт (pages/holbogdoh.html)
CREATE TABLE study_inquiries (
  id SERIAL PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  school VARCHAR(255),
  grade VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  program_interest VARCHAR(255),
  status VARCHAR(20) DEFAULT 'new', -- new, contacted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Багштай холбогдох хүсэлт ("Багштай холбогдмоор байна уу?" форм)
CREATE TABLE contact_requests (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  program VARCHAR(255),
  message TEXT,
  sms_status VARCHAR(20) DEFAULT 'sent', -- sent, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Мэдэгдлүүд
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- attendance, schedule, payment, leave
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_lesson_id ON attendance(lesson_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_teachers_branch_id ON teachers(branch_id);
CREATE INDEX idx_contact_requests_teacher_id ON contact_requests(teacher_id);
CREATE INDEX idx_assessment_requests_branch_id ON assessment_requests(branch_id);

-- ============================================
-- TRIGGERS (updated_at автоматаар шинэчлэх)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
