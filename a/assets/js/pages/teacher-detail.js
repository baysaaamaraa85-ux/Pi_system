import { getTeacherById, getTeacherSchedule } from '../services/teacher.service.js';
import { showToast } from '../ui/toast.js';

// URL-аас teacher ID авах
const urlParams = new URLSearchParams(window.location.search);
const teacherId = urlParams.get('id') || 1;

// Багшийн мэдээлэл ачаалах
async function loadTeacher() {
  const container = document.querySelector('.container');
  if (!container) return;

  try {
    const response = await getTeacherById(teacherId);

    if (response.success) {
      renderTeacher(response.data);
      await loadSchedule();
    } else {
      container.innerHTML = '<p style="text-align:center;padding:40px;">Багш олдсонгүй</p>';
    }
  } catch (error) {
    showToast('Багшийн мэдээлэл ачаалах үед алдаа гарлаа', 'error');
    container.innerHTML = '<p style="text-align:center;padding:40px;color:red;">Алдаа гарлаа</p>';
  }
}

// Багшийн мэдээлэл харуулах
function renderTeacher(teacher) {
  // Avatar (зураг байвал зураг, үгүй бол эхний үсэг)
  const avatar = document.querySelector('.avatar');
  if (avatar) {
    if (teacher.photoUrl) {
      const img = document.createElement('img');
      img.src = `..${teacher.photoUrl}`;
      img.alt = teacher.name;
      img.className = 'avatar-photo';
      img.onerror = () => {
        img.replaceWith(avatar);
        avatar.textContent = teacher.firstName.charAt(0);
      };
      avatar.replaceWith(img);
    } else {
      avatar.textContent = teacher.firstName.charAt(0);
    }
  }

  // Үнэлгээ
  const rating = document.querySelector('.rating');
  if (rating) {
    rating.textContent = `⭐ ${teacher.rating} (${teacher.totalReviews})`;
  }

  // Холбоо барих
  const contactInfo = document.querySelectorAll('.sidebar p');
  if (contactInfo.length >= 2) {
    contactInfo[0].textContent = `📧 ${teacher.email}`;
    contactInfo[1].textContent = `📞 ${teacher.phone}`;
  }

  // Нэр
  const title = document.querySelector('.title');
  if (title) {
    title.textContent = teacher.name;
  }

  // Мэргэшил chip-үүд
  const tags = document.querySelector('#td-tags');
  if (tags) {
    tags.innerHTML = teacher.specialties.map((s) => `<span class="tag">${s}</span>`).join('');
  }

  // Тухай
  const aboutCard = document.querySelector('.card:first-of-type');
  if (aboutCard && teacher.bio) {
    const bioText = aboutCard.querySelector('p');
    if (bioText) {
      bioText.textContent = teacher.bio;
    }
  }

  // "Энэ багшийг сонгох" — бүртгэлийн урсгал руу (салбар аль хэдийн тодорхой тул branch-select алгасна)
  const chooseBtn = document.querySelector('#choose-teacher-btn');
  if (chooseBtn) {
    chooseBtn.href = `register.html?teacherId=${teacher.id}`;
  }
}

// Grid дэх мөрүүд (өдрийн цайны завсарлагыг алгасна)
const GRID_HOURS = [8, 9, 10, 11, 14, 15, 16, 17];
// Мон-Ням дараалал; JS Date.getDay() 0=Ням тул index-үүдийг эргүүлж холбоно
const GRID_DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
const jsDayToColumn = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

async function loadSchedule() {
  const scheduleCard = document.querySelector('.card:last-of-type');
  if (!scheduleCard) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await getTeacherSchedule(teacherId, today, nextWeek);
    const lessons = response.success ? response.data : [];

    scheduleCard.querySelectorAll('.schedule-item, .schedule-empty, .schedule-grid').forEach((el) => el.remove());

    if (lessons.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'schedule-empty';
      empty.textContent = 'Энэ 7 хоногт товлогдсон хичээл алга байна';
      scheduleCard.appendChild(empty);
      return;
    }

    // Цаг(мөр) × Өдөр(багана) тус бүрт тохирох хичээлийг олоход хялбар болгож газарзүйжүүлнэ
    const slotMap = {};
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
              const isAvailable = lesson && lesson.enrolledCount < lesson.maxStudents;
              return `<div class="sg-cell sg-slot${isAvailable ? ' available' : ''}"></div>`;
            }).join('')}
          </div>
        `,
      ).join('')}
      <div class="sg-legend">
        <span class="sg-legend-item"><i class="sg-dot available"></i> Боломжтой</span>
        <span class="sg-legend-item"><i class="sg-dot"></i> Боломжгүй</span>
      </div>
      <p class="schedule-hint">Тодорхой цаг сонгохын тулд «Энэ багшийг сонгох» товчоор бүртгэлээ үргэлжлүүлнэ үү.</p>
    `;

    scheduleCard.appendChild(grid);
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
  }
}

// Ачаалах
loadTeacher();
