# Пи тоо Backend — Суулгах заавар

## 1. Шаардлагатай зүйлс

- **Node.js** v18+
- **PostgreSQL** v14+  (суулгах явцад тавьсан нууц үгээ санаж авах!)

## 2. Хурдан эхлүүлэх (3 алхам)

```bash
cd backend
npm install

# .env файл үүсгэх
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
```

Дараа нь **`.env` файлыг нээж хоёр мөр засна:**

```env
DB_PASSWORD=<тухайн компьютерийн postgres нууц үг>
PORT=3001
```

```bash
# Өгөгдлийн сан + бүх хүснэгт + жишээ өгөгдөл + демо хичээлүүд — НЭГ КОМАНД
npm run setup

# Сервер асаах
npm run dev
```

Амжилттай бол:

```
🚀 Server: http://localhost:3001
✅ PostgreSQL-д амжилттай холбогдлоо
```

## 3. `npm run setup` юу хийдэг вэ?

1. `pi_too` өгөгдлийн сан байхгүй бол үүсгэнэ
2. `npm run db:migrate` — `schema.sql`-с бүх хүснэгт үүсгэнэ
3. `npm run db:seed` — 4 салбар, 5 багш, жишээ сурагч/эцэг эх
4. `npm run db:seed-lessons` — ирэх 7 хоногийн демо хичээлүүд (Хуваарь сонгох алхамд хэрэгтэй)

> Аль хэдийн хийгдсэн алхмыг зөөлөн алгасна, тиймээс дахин ажиллуулж болно.
> Хичээлийн хуваарийг л шинэчлэхийг хүсвэл: `npm run db:seed-lessons`

## 4. Тест

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/teachers
```

Жишээ багшаар нэвтрэх — и-мэйл `baysgalan@pitoo.mn`, нууц үг `password123`.

## 5. Түгээмэл алдаа

| Алдаа | Шалтгаан / засвар |
|---|---|
| `password authentication failed` (28P01) | `.env`-ийн `DB_PASSWORD` буруу |
| `ECONNREFUSED` | PostgreSQL асаагүй байна |
| `database "pi_too" does not exist` | `npm run setup` ажиллуулаагүй |
| Frontend «Backend сервертэй холбогдож чадсангүй» | `PORT=3001` болгоогүй, эсвэл `npm run dev` ажиллаагүй |
| Багш нар хэсэг хоосон | `npm run db:seed` ажиллаагүй (өгөгдөл алга) |

## 6. Бүтэц

```
backend/src/
├── server.js               # эхлэл цэг — Express + route холболт
├── config/database.js      # PostgreSQL Pool
├── routes/*.routes.js      # URL → controller
├── controllers/*.controller.js
├── middleware/             # auth (JWT), errorHandler, validator
├── services/               # qpay.service, sms.service (stub)
└── database/
    ├── schema.sql          # бүх хүснэгт
    ├── setup.js            # нэг товчийн тохиргоо
    ├── seed.js             # салбар/багш/сурагч
    └── seed-lessons.js     # демо хичээлүүд
```

## 7. Портыг өөрчлөх

`.env` доtorх `PORT` утгыг л солино. Frontend `a/assets/js/services/api.js` дотор `API_BASE_URL` мөн тэр порттой таарч байх ёстой (одоо `3001`).
