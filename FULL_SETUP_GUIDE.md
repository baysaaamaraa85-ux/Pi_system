# 🎓 Пи тоо - Бүрэн суулгах заавар

## 📋 Агуулга

1. [Шаардлагатай зүйлс](#шаардлагатай-зүйлс)
2. [Backend суулгах](#backend-суулгах)
3. [Frontend суулгах](#frontend-суулгах)
4. [Тестлэх](#тестлэх)
5. [Алдаа засах](#алдаа-засах)

---

## 1. Шаардлагатай зүйлс

- ✅ Node.js v18+ ([Татах](https://nodejs.org/))
- ✅ PostgreSQL v14+ ([Татах](https://www.postgresql.org/download/))
- ✅ Git (optional)
- ✅ VS Code эсвэл бусад editor

---

## 2. Backend суулгах

### 2.1. PostgreSQL тохируулах

**Windows:**
```bash
# PostgreSQL суулгасны дараа
# pgAdmin эсвэл psql ашиглан:
CREATE DATABASE pi_too;
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb pi_too
```

**Linux:**
```bash
sudo apt-get install postgresql
sudo -u postgres createdb pi_too
```

### 2.2. Backend dependencies суулгах

```bash
cd backend
npm install
```

### 2.3. Environment тохируулах

`.env.example`-ийг `.env` болгон хуулах:
```bash
copy .env.example .env
```

`.env` файлыг засах:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pi_too
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE  # Өөрийн нууц үг

PORT=3000
NODE_ENV=development

JWT_SECRET=change_this_to_random_secret_key_12345
JWT_EXPIRES_IN=7d
```

### 2.4. Database migration

```bash
npm run db:migrate
```

✅ Амжилттай бол: `✅ Migration амжилттай дууслаа!`

### 2.5. Жишээ өгөгдөл оруулах

```bash
npm run db:seed
```

Энэ нь дараах өгөгдлийг оруулна:
- 4 салбар (УБ Төв, Хан-Уул, Баянзүрх, Сүхбаатар)
- 5 багш (Баясгалан, Амирлангуй, Энхбилэг, Оюунгэрэл, Энхтуяа)
- 1 сурагч (Тэмүүлэн)
- 1 эцэг эх (Батбаяр)

**Жишээ нэвтрэх мэдээлэл:**
```
Багш:
Email: baysgalan@pitoo.mn
Password: password123

Сурагч:
Email: temuulen@example.com
Password: password123

Эцэг эх:
Email: batbayar@example.com
Password: password123
```

### 2.6. Backend ажиллуулах

```bash
npm run dev
```

✅ Амжилттай бол:
```
╔═══════════════════════════════════════╗
║   🎓 Пи тоо Backend Server            ║
║   🚀 Server: http://localhost:3000    ║
║   📊 Environment: development         ║
╚═══════════════════════════════════════╝
✅ PostgreSQL-д амжилттай холбогдлоо
```

---

## 3. Frontend суулгах

### 3.1. Live Server суулгах (VS Code)

1. VS Code-д Extensions хэсэг нээх
2. "Live Server" хайж суулгах
3. `a/index.html` файлыг нээх
4. Баруун доод буланд "Go Live" дарах

Эсвэл командаар:
```bash
cd a
npx serve
```

### 3.2. API URL тохируулах

`a/assets/js/services/api.js` файлд:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

---

## 4. Тестлэх

### 4.1. Backend тест

**Health check:**
```bash
curl http://localhost:3000/health
```

**Нэвтрэх:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"baysgalan@pitoo.mn\",\"password\":\"password123\"}"
```

**Багш нар:**
```bash
curl http://localhost:3000/api/teachers
```

### 4.2. Frontend тест

1. Browser-д `http://localhost:5500` (эсвэл Live Server-ийн port) нээх
2. "Нэвтрэх" дарах
3. Жишээ мэдээлэл оруулах:
   - Email: `baysgalan@pitoo.mn`
   - Password: `password123`
4. Багшийн dashboard харагдах ёстой

### 4.3. Бүх функц тестлэх

- ✅ Нэвтрэх хуудас → Backend-тэй холбогдсон
- ✅ Багш жагсаалт → Backend-аас өгөгдөл татдаг
- ✅ Салбар сонгох → Backend-аас салбарууд ачаалагдана
- ✅ Шүүлтүүр, хайлт → Ажиллаж байна
- ✅ Toast мэдэгдэл → Харагдаж байна
- ✅ Loading indicator → Ажиллаж байна

---

## 5. Алдаа засах

### ❌ "ECONNREFUSED" алдаа

**Шалтгаан:** PostgreSQL ажиллахгүй байна

**Шийдэл:**
```bash
# Windows
pg_ctl status

# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

### ❌ "password authentication failed"

**Шалтгаан:** `.env` файл дахь нууц үг буруу

**Шийдэл:** `.env` файлыг засаж зөв нууц үг оруулах

### ❌ "database does not exist"

**Шалтгаан:** `pi_too` өгөгдлийн сан үүсээгүй

**Шийдэл:**
```sql
CREATE DATABASE pi_too;
```

### ❌ "Port 3000 already in use"

**Шалтгаан:** 3000 port ашиглагдаж байна

**Шийдэл:** `.env` файлд өөр port тохируулах:
```env
PORT=3001
```

### ❌ CORS алдаа

**Шалтгаан:** Frontend болон Backend өөр domain дээр байна

**Шийдэл:** Backend-д CORS аль хэдийн тохируулагдсан, гэхдээ хэрэв асуудал гарвал `backend/src/server.js` файлд:
```javascript
app.use(cors({
  origin: 'http://localhost:5500'  // Frontend-ийн URL
}));
```

### ❌ Module import алдаа

**Шалтгаан:** Browser ES6 modules дэмжихгүй байна

**Шийдэл:** HTML файлд `type="module"` нэмэх:
```html
<script type="module" src="..."></script>
```

---

## 6. Бүтэц

```
js_pii_too/
├── backend/                    # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── config/            # Database холболт
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── database/          # Schema, migration, seed
│   │   └── server.js          # Main server
│   ├── .env                   # Environment variables
│   └── package.json
│
└── a/                         # Frontend (HTML/CSS/JS)
    ├── assets/
    │   ├── css/              # Styles
    │   ├── js/
    │   │   ├── services/     # API дуудлага
    │   │   ├── ui/           # UI helpers
    │   │   └── pages/        # Хуудас бүрийн JS
    │   └── images/
    ├── pages/                # HTML хуудаснууд
    └── index.html
```

---

## 7. API Endpoints

### Auth
- `POST /api/auth/register` - Бүртгүүлэх
- `POST /api/auth/login` - Нэвтрэх
- `GET /api/auth/me` - Одоогийн хэрэглэгч

### Teachers
- `GET /api/teachers` - Багш нарын жагсаалт
- `GET /api/teachers/:id` - Багшийн дэлгэрэнгүй
- `GET /api/teachers/:id/schedule` - Багшийн хуваарь

### Students
- `GET /api/students/:id/progress` - Сурагчийн явц
- `GET /api/students/:id/schedule` - Сурагчийн хуваарь
- `GET /api/students/:id/attendance` - Ирцийн түүх

### Branches
- `GET /api/branches` - Салбаруудын жагсаалт
- `GET /api/branches/:id` - Салбарын дэлгэрэнгүй

---

## 8. Дараагийн алхмууд

Одоо дараах функцуудыг нэмж хийх хэрэгтэй:

### Backend:
- [ ] Ирц бүртгэх API (QR code)
- [ ] Төлбөрийн систем (QPay)
- [ ] Чөлөөний хүсэлт
- [ ] Мэдэгдлийн систем
- [ ] File upload (зураг)

### Frontend:
- [ ] Student dashboard backend холболт
- [ ] Teacher dashboard backend холболт
- [ ] Parent dashboard backend холболт
- [ ] Бүртгүүлэх форм backend холболт
- [ ] QR code scanner

---

## 9. Хөгжүүлэлтийн зөвлөмж

### Backend:
- `nodemon` ашиглан auto-restart
- Postman/Insomnia ашиглан API тестлэх
- pgAdmin ашиглан database хянах

### Frontend:
- Browser DevTools Console шалгах
- Network tab-аар API дуудлага хянах
- Vue DevTools эсвэл React DevTools (хэрэв ашиглавал)

### Git:
```bash
git add .
git commit -m "Backend + Frontend холболт"
git push
```

---

## 10. Production deployment

### Backend (Railway, Render, Heroku):
1. Environment variables тохируулах
2. PostgreSQL database үүсгэх
3. Migration ажиллуулах
4. Deploy хийх

### Frontend (Vercel, Netlify):
1. API_BASE_URL production URL болгох
2. Build хийх
3. Deploy хийх

---

## 📞 Тусламж

Асуудал гарвал:
1. Console log шалгах
2. Network tab шалгах
3. Backend logs шалгах
4. Database шалгах

Амжилт хүсье! 🚀
