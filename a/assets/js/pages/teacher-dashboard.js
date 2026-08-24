import { getTeacherById, getTeacherSchedule } from '../services/teacher.service.js';
import { createLesson } from '../services/lesson.service.js';
import { getCurrentUser, logout } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';

let currentUser = null;
let teacherId = null;

const DAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

// Хэрэглэгчийн мэдээлэл авах
async function loadUser() {
  try {
    const response = await getCurrentUser();
    if (response.success) {
      currentUser = response.data;

      // Багшийн ID авах
      teacherId = currentUser.teacherId || 1;

      await Promise.all([loadSubjects(), loadTodayCount(), loadUpcomingSchedule()]);
    }
  } catch (error) {
    showToast('Хэрэглэгчийн мэдээлэл ачаалах үед алдаа гарлаа', 'error');
    setTimeout(() => logout(), 2000);
  }
}

// "Хичээл нэмэх" формын хичээлийн сонголт — багшийн өөрийн мэргэшлээс
async function loadSubjects() {
  try {
    const response = await getTeacherById(teacherId);
    if (!response.success) return;

    const select = document.getElementById('al-subject');
    select.innerHTML = (response.data.specialties || []).map((s) => `<option value="${s}">${s}</option>`).join('');
  } catch (error) {
    console.error('Мэргэшил ачаалах алдаа:', error);
  }
}

// Өнөөдрийн хичээлийн тоо (статистик карт)
async function loadTodayCount() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await getTeacherSchedule(teacherId, today, today);

    if (response.success) {
      const lessonCountCard = document.querySelector('.stat-card:first-child h2');
      if (lessonCountCard) lessonCountCard.textContent = response.data.length;
    }
  } catch (error) {
    console.error('Өнөөдрийн хичээл ачаалах алдаа:', error);
  }
}

// Ирэх 7 хоногийн хуваарийг жагсаах
async function loadUpcomingSchedule() {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await getTeacherSchedule(teacherId, today, nextWeek);

    if (!response.success || response.data.length === 0) {
      list.innerHTML = '<p class="schedule-empty">Одоогоор товлогдсон хичээл алга байна. Дээрх маягтаар нэмнэ үү.</p>';
      return;
    }

    list.innerHTML = response.data.map((lesson) => {
      const start = new Date(lesson.startTime);
      const end = new Date(lesson.endTime);
      const dateLabel = `${DAYS[start.getDay()]}, ${start.toLocaleDateString('mn-MN')}`;
      const timeLabel = `${start.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}`;
      const isFull = lesson.enrolledCount >= lesson.maxStudents;

      return `
        <div class="schedule-card${isFull ? ' danger' : ''}">
          <div class="schedule-left">
            <div class="schedule-icon"><i class="fa-regular fa-clock"></i></div>
            <div>
              <h3>${dateLabel} | ${timeLabel}</h3>
              <p>${lesson.subject}${lesson.room ? ' | ' + lesson.room + '-р тасаг' : ''}</p>
            </div>
          </div>
          <div class="students-count">${lesson.enrolledCount}/${lesson.maxStudents}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
    list.innerHTML = '<p class="schedule-empty">Алдаа гарлаа</p>';
  }
}

// Хичээл нэмэх маягт
const addLessonForm = document.getElementById('add-lesson-form');
if (addLessonForm) {
  addLessonForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const subject = document.getElementById('al-subject').value;
    const date = document.getElementById('al-date').value;
    const hour = document.getElementById('al-hour').value;
    const maxStudents = document.getElementById('al-capacity').value || 6;

    if (!subject || !date) {
      showToast('Хичээл, огноогоо сонгоно уу', 'error');
      return;
    }

    const submitBtn = addLessonForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await createLesson({ subject, date, hour: Number(hour), maxStudents: Number(maxStudents) });
      showToast('Хичээл нэмэгдлээ', 'success');
      document.getElementById('al-date').value = '';
      await Promise.all([loadTodayCount(), loadUpcomingSchedule()]);
    } catch (error) {
      showToast(error.message || 'Хичээл нэмэхэд алдаа гарлаа', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// Тэмдэглэл хадгалах
const saveBtn = document.querySelector('.save-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    showToast('Тэмдэглэл хадгалагдлаа', 'success');
  });
}

// Чөлөөний хүсэлт зөвшөөрөх/татгалзах
document.querySelectorAll('.approve').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('Хүсэлт зөвшөөрөгдлөө', 'success');
    btn.closest('.request-card').remove();
  });
});

document.querySelectorAll('.reject').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('Хүсэлт татгалзагдлаа', 'info');
    btn.closest('.request-card').remove();
  });
});

// Гарах
const profileBtn = document.querySelector('.profile');
if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    if (confirm('Гарахдаа итгэлтэй байна уу?')) {
      logout();
    }
  });
}

// Ачаалах
loadUser();
