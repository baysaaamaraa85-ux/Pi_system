import { getTeachers, normalizeTeacher } from '../services/teacher.service.js';
import { teacherCardHtml } from '../ui/teacher-card.js';
import { showToast } from '../ui/toast.js';

// Анкет бөглөгдөөгүй бол энэ алхамд орж болохгүй
const raw = sessionStorage.getItem('pendingEnrollment');
if (!raw) {
  window.location.href = 'register.html';
}

const grid = document.getElementById('teacher-grid');

function renderTeachers(teachers) {
  if (!teachers.length) {
    grid.innerHTML = '<p class="grid-status">Багш олдсонгүй</p>';
    return;
  }

  const cards = teachers
    .map((teacher) => teacherCardHtml(normalizeTeacher(teacher), { as: 'button', cta: 'Багш сонгох' }))
    .join('');

  grid.innerHTML = `<ul class="tcard-grid">${cards}</ul>`;

  grid.querySelectorAll('.tcard').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const teacherId = card.dataset.teacherId;

      const pending = JSON.parse(sessionStorage.getItem('pendingEnrollment') || '{}');
      pending.teacherId = teacherId;
      sessionStorage.setItem('pendingEnrollment', JSON.stringify(pending));

      window.location.href = `schedule-select.html?teacherId=${teacherId}`;
    });
  });
}

async function loadTeachers() {
  try {
    const response = await getTeachers();
    if (response.success && Array.isArray(response.data)) {
      renderTeachers(response.data);
    } else {
      grid.innerHTML = '<p class="grid-status">Багш олдсонгүй</p>';
    }
  } catch (error) {
    showToast('Багш нарыг ачаалах үед алдаа гарлаа', 'error');
    grid.innerHTML = '<p class="grid-status">Алдаа гарлаа</p>';
  }
}

loadTeachers();
