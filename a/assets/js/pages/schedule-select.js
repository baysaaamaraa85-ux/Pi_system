import { getTeacherById, getTeacherSchedule } from '../services/teacher.service.js';
import { enrollInLesson } from '../services/lesson.service.js';
import { showToast } from '../ui/toast.js';

const pendingRaw = sessionStorage.getItem('pendingEnrollment');
if (!pendingRaw) {
  window.location.href = 'register.html';
}

const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
const teacherId = new URLSearchParams(window.location.search).get('teacherId') || pending.teacherId;

if (!teacherId) {
  window.location.href = 'teacher-select.html';
}

const GRID_HOURS = [8, 9, 10, 11, 14, 15, 16, 17];
const GRID_DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
const jsDayToColumn = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

let slotMap = {};
let selectedLesson = null;
let selectedLabel = '';

const nextBtn = document.getElementById('next-btn');

async function loadTeacherSummary() {
  try {
    const response = await getTeacherById(teacherId);
    if (!response.success) return;

    const teacher = response.data;

    document.getElementById('ts-name').textContent = teacher.name;

    document.getElementById('ts-chips').innerHTML = (teacher.specialties || [])
      .map((s) => `<span class="ts-chip">${s}</span>`)
      .join('');

    const bioEl = document.getElementById('ts-bio');
    if (teacher.bio) bioEl.textContent = teacher.bio;
    else bioEl.hidden = true;

    if (teacher.branchName) {
      document.getElementById('ts-branch-name').textContent = teacher.branchName;
      document.getElementById('ts-branch').hidden = false;
    }

    const avatarBox = document.getElementById('ts-avatar');
    if (teacher.photoUrl) {
      const img = document.createElement('img');
      img.src = `..${teacher.photoUrl}`;
      img.alt = teacher.name;
      img.className = 'ts-avatar-photo';
      img.onerror = () => { img.replaceWith(avatarBox); avatarBox.textContent = teacher.firstName.charAt(0); };
      avatarBox.replaceWith(img);
    } else {
      avatarBox.textContent = teacher.firstName.charAt(0);
    }
  } catch (error) {
    console.error('Багшийн мэдээлэл ачаалах алдаа:', error);
  }
}

async function loadSchedule() {
  const holder = document.getElementById('schedule-holder');

  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await getTeacherSchedule(teacherId, today, nextWeek);
    const lessons = response.success ? response.data : [];

    if (lessons.length === 0) {
      holder.innerHTML = '<p class="grid-status">Энэ 7 хоногт товлогдсон хичээл алга байна</p>';
      return;
    }

    slotMap = {};
    lessons.forEach((lesson) => {
      const startTime = new Date(lesson.startTime);
      const hour = startTime.getHours();
      const column = jsDayToColumn[startTime.getDay()];
      slotMap[`${hour}-${column}`] = lesson;
    });

    const grid = document.createElement('div');
    grid.className = 'schedule-grid';

    grid.innerHTML = `
      <div class="sg-row sg-head">
        <div class="sg-cell sg-label">Цаг</div>
        ${GRID_DAYS.map((d) => `<div class="sg-cell sg-daylabel">${d}</div>`).join('')}
      </div>
      ${GRID_HOURS.map(
        (hour) => `
          <div class="sg-row">
            <div class="sg-cell sg-label">${String(hour).padStart(2, '0')}:00</div>
            ${GRID_DAYS.map((_, column) => {
              const lesson = slotMap[`${hour}-${column}`];
              const seatsLeft = lesson ? lesson.maxStudents - lesson.enrolledCount : 0;
              const isAvailable = lesson && seatsLeft > 0;
              return `<div class="sg-cell sg-slot${isAvailable ? ' available' : ''}"
                           ${isAvailable ? `data-hour="${hour}" data-column="${column}"` : ''}>${isAvailable ? seatsLeft + ' сул' : ''}</div>`;
            }).join('')}
          </div>
        `,
      ).join('')}
      <div class="sg-legend">
        <span class="sg-legend-item"><i class="sg-dot available"></i> Боломжтой</span>
        <span class="sg-legend-item"><i class="sg-dot"></i> Боломжгүй</span>
      </div>
    `;

    holder.innerHTML = '';
    holder.appendChild(grid);

    grid.querySelectorAll('.sg-slot.available').forEach((cell) => {
      cell.addEventListener('click', () => {
        grid.querySelectorAll('.sg-slot.selected').forEach((el) => el.classList.remove('selected'));
        cell.classList.add('selected');

        selectedLesson = slotMap[`${cell.dataset.hour}-${cell.dataset.column}`];
        const dayLabel = GRID_DAYS[Number(cell.dataset.column)];
        const timeLabel = `${String(cell.dataset.hour).padStart(2, '0')}:00`;
        selectedLabel = `${dayLabel} ${timeLabel}`;

        nextBtn.classList.remove('is-disabled');
      });
    });
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
    holder.innerHTML = '<p class="grid-status">Алдаа гарлаа</p>';
  }
}

nextBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!selectedLesson || nextBtn.classList.contains('is-disabled')) return;

  nextBtn.classList.add('is-disabled');
  const link = nextBtn.querySelector('a');
  const originalText = link.textContent;
  link.textContent = 'Бүртгэж байна...';

  try {
    await enrollInLesson(selectedLesson.id, pending.studentId);

    pending.teacherId = teacherId;
    pending.lessonId = selectedLesson.id;
    pending.scheduleLabel = selectedLabel;
    pending.subject = selectedLesson.subject;
    sessionStorage.setItem('pendingEnrollment', JSON.stringify(pending));

    window.location.href = 'payment.html';
  } catch (error) {
    showToast(error.message || 'Хуваарьт бүртгэхэд алдаа гарлаа', 'error');
    nextBtn.classList.remove('is-disabled');
    link.textContent = originalText;
    // Дүүрсэн байвал жагсаалтыг шинэчилж харуулна
    loadSchedule();
  }
});

loadTeacherSummary();
loadSchedule();
