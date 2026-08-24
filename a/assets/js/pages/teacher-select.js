import { getTeachers } from '../services/teacher.service.js';
import { showToast } from '../ui/toast.js';

// Анкет бөглөгдөөгүй бол энэ алхамд орж болохгүй
const raw = sessionStorage.getItem('pendingEnrollment');
if (!raw) {
  window.location.href = 'register.html';
}

const grid = document.getElementById('teacher-grid');

function renderTeachers(teachers) {
  if (teachers.length === 0) {
    grid.innerHTML = '<p class="grid-status">Багш олдсонгүй</p>';
    return;
  }

  grid.innerHTML = teachers.map((teacher) => {
    const avatar = teacher.photoUrl
      ? `<img src="..${teacher.photoUrl}" alt="${teacher.name}" class="t-avatar-photo">`
      : `<div class="t-avatar">${teacher.firstName.charAt(0)}</div>`;

    return `
      <a href="#" class="t-card" data-teacher-id="${teacher.id}">
        <div class="t-avatar-box">${avatar}</div>
        <div class="t-name">${teacher.name}</div>
        <div class="t-specialty">${(teacher.specialties || []).join(' • ')}</div>
      </a>
    `;
  }).join('');

  grid.querySelectorAll('.t-card').forEach((card) => {
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
    if (response.success) {
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
