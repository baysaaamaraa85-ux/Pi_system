# Пи тоо - Backend API

Node.js + Express + PostgreSQL дээр суурилсан backend систем.

## Суулгах

```bash
npm install
```

## Тохиргоо

1. `.env.example`-ийг `.env` болгон хуулж тохируулна:
```bash
copy .env.example .env
```

2. PostgreSQL өгөгдлийн сан үүсгэнэ:
```sql
CREATE DATABASE pi_too;
```

3. Хүснэгтүүдийг үүсгэнэ:
```bash
npm run db:migrate
```

4. Жишээ өгөгдөл оруулна (optional):
```bash
npm run db:seed
```

## Ажиллуулах

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Бүртгүүлэх
- `POST /api/auth/login` - Нэвтрэх
- `GET /api/auth/me` - Одоогийн хэрэглэгч

### Багш
- `GET /api/teachers` - Багш нарын жагсаалт
- `GET /api/teachers/:id` - Багшийн дэлгэрэнгүй

### Салбар
- `GET /api/branches` - Салбаруудын жагсаалт

### Хуваарь
- `GET /api/schedule/student/:id` - Сурагчийн хуваарь
- `GET /api/schedule/teacher/:id` - Багшийн хуваарь

### Ирц
- `POST /api/attendance/checkin` - Ирц бүртгэх
- `GET /api/attendance/student/:id` - Ирцийн түүх

### Төлбөр
- `POST /api/payment/create` - Төлбөр үүсгэх
- `GET /api/payment/:id` - Төлбөрийн мэдээлэл
