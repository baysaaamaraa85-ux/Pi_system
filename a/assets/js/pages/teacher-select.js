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
    const initial = teacher.firstName?.charAt(0) || teacher.name?.charAt(0) || '?';
    const avatar = teacher.photoUrl
      ? `<img src="..${teacher.photoUrl}" alt="${teacher.name}" class="t-avatar-photo">`
      : `<div class="t-avatar">${initial}</div>`;
    const chips = (teacher.specialties || []).map((s) => `<span class="t-chip">${s}</span>`).join('');
    const bio = teacher.bio ? `<p class="t-bio">${teacher.bio}</p>` : '';
    const pin = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    return `
      <a href="#" class="t-card" data-teacher-id="${teacher.id}">
        <div class="t-avatar-box">${avatar}</div>
        <div class="t-name">${teacher.name}</div>
        ${chips ? `<div class="t-chips">${chips}</div>` : ''}
        <div class="t-branch">${pin}${teacher.branchName || 'Салбар тодорхойгүй'}</div>
        ${bio}
        <span class="t-cta">Багш сонгох</span>
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
