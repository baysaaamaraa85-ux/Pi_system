# Пи тоо Backend - Суулгах заавар

## 1. Шаардлагатай зүйлс

- Node.js (v18 эсвэл түүнээс дээш)
- PostgreSQL (v14 эсвэл түүнээс дээш)
- npm эсвэл yarn

## 2. PostgreSQL суулгах ба тохируулах

### Windows дээр:
1. PostgreSQL татаж суулгана: https://www.postgresql.org/download/windows/
2. Суулгах явцад нууц үг тохируулна (жишээ: `postgres123`)
3. pgAdmin эсвэл psql ашиглан өгөгдлийн сан үүсгэнэ:

```sql
CREATE DATABASE pi_too;
```

### macOS дээр (Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
createdb pi_too
```

### Linux дээр:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb pi_too
```

## 3. Backend суулгах

### 3.1. Dependencies суулгах
```bash
cd backend
npm install
```

### 3.2. Environment тохируулах
`.env.example` файлыг `.env` болгон хуулж тохируулна:

```bash
copy .env.example .env
```

`.env` файлыг засаж өөрийн тохиргоог оруулна:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pi_too
DB_USER=postgres
DB_PASSWORD=postgres123  # Өөрийн нууц үг

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=my_super_secret_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d
```

### 3.3. Өгөгдлийн сангийн бүтэц үүсгэх (Migration)
```bash
npm run db:migrate
```

Амжилттай бол:
```
✅ Migration амжилттай дууслаа!
```

### 3.4. Жишээ өгөгдөл оруулах (Optional)
```bash
npm run db:seed
```

Энэ нь дараах өгөгдлийг оруулна:
- 4 салбар
- 5 тасалгаа
- 5 багш
- 1 жишээ сурагч
- 1 жишээ эцэг эх

## 4. Server ажиллуулах

### Development mode (auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Амжилттай бол:
```
╔═══════════════════════════════════════╗
║   🎓 Пи тоо Backend Server            ║
║   🚀 Server: http://localhost:3000    ║
║   📊 Environment: development         ║
╚═══════════════════════════════════════╝
✅ PostgreSQL-д амжилттай холбогдлоо
```

## 5. API тестлэх

### Health check:
```bash
curl http://localhost:3000/health
```

### Нэвтрэх (жишээ багш):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"baysgalan@pitoo.mn\",\"password\":\"password123\"}"
```

### Багш нарын жагсаалт:
```bash
curl http://localhost:3000/api/teachers
```

### Салбаруудын жагсаалт:
```bash
curl http://localhost:3000/api/branches
```

## 6. Алдаа засах (Troubleshooting)

### "ECONNREFUSED" алдаа
PostgreSQL ажиллаж байгаа эсэхийг шалгана:
```bash
# Windows
pg_ctl status

# macOS/Linux
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### "password authentication failed"
`.env` файл дахь `DB_PASSWORD` зөв эсэхийг шалгана.

### "database does not exist"
Өгөгдлийн сан үүсгэх:
```sql
CREATE DATABASE pi_too;
```

### Port 3000 ашиглагдаж байна
`.env` файлд өөр port тохируулна:
```env
PORT=3001
```

## 7. Бүтэц

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL холболт
│   ├── controllers/
│   │   ├── auth.controller.js   # Нэвтрэх/бүртгүүлэх
│   │   ├── teacher.controller.js
│   │   ├── student.controller.js
│   │   └── branch.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── teacher.routes.js
│   │   ├── student.routes.js
│   │   └── branch.routes.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validator.js         # Input validation
│   │   └── errorHandler.js      # Error handling
│   ├── database/
│   │   ├── schema.sql           # Database schema
│   │   ├── migrate.js           # Migration script
│   │   └── seed.js              # Seed data
│   └── server.js                # Main server file
├── .env                         # Environment variables
├── .env.example
├── package.json
└── README.md
```

## 8. Дараагийн алхмууд

- [ ] Ирц бүртгэх API (QR code)
- [ ] Төлбөрийн систем (QPay integration)
- [ ] Чөлөөний хүсэлт
- [ ] Мэдэгдлийн систем
- [ ] File upload (багшийн зураг)
- [ ] Email notification
- [ ] SMS notification

## 9. Хөгжүүлэлтийн зөвлөмж

- `nodemon` ашиглан автомат restart хийнэ
- Postman эсвэл Insomnia ашиглан API тестлэнэ
- pgAdmin ашиглан өгөгдлийн санг хянана
- Git ашиглан version control хийнэ
