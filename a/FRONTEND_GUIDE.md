# Frontend - Backend холболтын заавар

## 📁 Бүтэц

```
a/assets/js/
├── services/           # Backend API дуудлага
│   ├── api.js         # Үндсэн API wrapper
│   ├── auth.service.js
│   ├── teacher.service.js
│   ├── student.service.js
│   └── branch.service.js
├── ui/                # UI helper функцууд
│   ├── toast.js       # Мэдэгдэл харуулах
│   └── loading.js     # Loading indicator
└── pages/             # Хуудас бүрийн JS
    ├── login.js
    ├── teachers.js
    └── branch-select.js
```

## 🔌 API холболт

### 1. Үндсэн тохиргоо (`api.js`)

```javascript
import { get, post, put, del, auth } from './services/api.js';

// GET хүсэлт
const data = await get('/teachers');

// POST хүсэлт
const result = await post('/auth/login', { email, password });

// Token шалгах
if (auth.isAuthenticated()) {
  // Нэвтэрсэн
}
```

### 2. Нэвтрэх (`auth.service.js`)

```javascript
import { login, logout, getCurrentUser } from './services/auth.service.js';

// Нэвтрэх
const response = await login('email@example.com', 'password123');

// Гарах
logout();

// Одоогийн хэрэглэгч
const user = await getCurrentUser();
```

### 3. Багш нар (`teacher.service.js`)

```javascript
import { getTeachers, getTeacherById } from './services/teacher.service.js';

// Бүх багш нар
const teachers = await getTeachers();

// Шүүлтүүртэй
const filtered = await getTeachers({
  specialty: 'Математик',
  minRating: 4.5,
  maxPrice: 500000,
  search: 'Батбаяр',
  sortBy: 'rating',
  order: 'DESC',
  page: 1,
  limit: 10
});

// Нэг багш
const teacher = await getTeacherById(1);
```

### 4. Сурагч (`student.service.js`)

```javascript
import { 
  getStudentProgress, 
  getStudentSchedule, 
  getStudentAttendance 
} from './services/student.service.js';

// Явц
const progress = await getStudentProgress(1);

// Хуваарь
const schedule = await getStudentSchedule(1, '2026-03-01', '2026-03-31');

// Ирц
const attendance = await getStudentAttendance(1, 20);
```

### 5. Салбар (`branch.service.js`)

```javascript
import { getBranches, getBranchById } from './services/branch.service.js';

// Бүх салбар
const branches = await getBranches();

// Нэг салбар
const branch = await getBranchById(1);
```

## 🎨 UI Helper-үүд

### Toast мэдэгдэл

```javascript
import { showToast } from './ui/toast.js';

showToast('Амжилттай хадгаллаа', 'success');
showToast('Алдаа гарлаа', 'error');
showToast('Анхааруулга', 'warning');
showToast('Мэдээлэл', 'info');
```

### Loading indicator

```javascript
import { showLoading, hideLoading } from './ui/loading.js';

const container = document.querySelector('.content');

showLoading(container);
// ... API дуудлага
hideLoading(container);
```

## 📄 Хуудас дээр ашиглах

### HTML-д холбох

```html
<!-- Module script ашиглах -->
<script type="module" src="../assets/js/pages/login.js"></script>
```

### Жишээ: Нэвтрэх хуудас

```javascript
// pages/login.js
import { login } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await login(email, password);
    
    if (response.success) {
      showToast('Амжилттай нэвтэрлээ!', 'success');
      window.location.href = '/pages/student-dashboard.html';
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
});
```

### Жишээ: Багш жагсаалт

```javascript
// pages/teachers.js
import { getTeachers } from '../services/teacher.service.js';
import { showLoading } from '../ui/loading.js';

async function loadTeachers() {
  const grid = document.querySelector('.teacher-grid');
  showLoading(grid);
  
  try {
    const response = await getTeachers({ sortBy: 'rating' });
    
    grid.innerHTML = response.data.map(teacher => `
      <div class="card">
        <h3>${teacher.name}</h3>
        <p>⭐ ${teacher.rating}</p>
      </div>
    `).join('');
  } catch (error) {
    grid.innerHTML = '<p>Алдаа гарлаа</p>';
  }
}

loadTeachers();
```

## 🔐 Authentication

### Token хадгалах

Token автоматаар localStorage-д хадгалагдана:
```javascript
// Нэвтрэх үед автоматаар хадгалагдана
await login(email, password);

// Гарах үед устгагдана
logout();
```

### Protected хуудаснууд

```javascript
import { checkAuth } from '../services/auth.service.js';

// Хуудас ачаалагдах үед шалгах
if (!checkAuth()) {
  window.location.href = '/pages/student-login.html';
}
```

## ⚙️ Backend тохиргоо

`api.js` файлд API URL-ийг өөрчлөх:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';  // Development
// const API_BASE_URL = 'https://api.pitoo.mn/api';  // Production
```

## 🧪 Тестлэх

### 1. Backend ажиллуулах
```bash
cd backend
npm run dev
```

### 2. Frontend ажиллуулах
```bash
cd a
# Live Server эсвэл бусад static server ашиглах
```

### 3. Жишээ хэрэглэгч
```
Email: baysgalan@pitoo.mn
Password: password123
```

## 📝 Дараагийн алхмууд

Одоо дараах хуудаснуудыг backend-тэй холбох хэрэгтэй:

- [ ] `student-dashboard.html` - Сурагчийн хянах самбар
- [ ] `teacher-dashboard.html` - Багшийн хянах самбар
- [ ] `parent-dashboard.html` - Эцэг эхийн хянах самбар
- [ ] `register.html` - Бүртгүүлэх форм
- [ ] `teacher-detail.html` - Багшийн дэлгэрэнгүй

Эдгээрийг хийхийг хүсвэл хэлээрэй!
