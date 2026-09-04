import { getStudentProgress, getStudentSchedule, getStudentAttendance } from '../services/student.service.js';
import { getCurrentUser, logout } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';

let currentUser = null;
let studentId = null;

// Бүртгэлийн урсгалаас (payment-success.html) шууд ирсэн бол яг тэр хүүхдийн ID-г ашиглана
const urlStudentId = new URLSearchParams(window.location.search).get('studentId');

const RING_CIRCUMFERENCE = 2 * Math.PI * 68; // r=68 (student-dashboard.css)
const DAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const LEAVE_TOTAL = 5;
const HOURS_PER_LESSON = 3;

const $ = (id) => document.getElementById(id);
const fmtDate = (dt) => {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtTime = (dt) => {
  const d = new Date(dt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Чимэглэлийн icon-уудыг [data-icon] дээр байрлуулна
document.querySelectorAll('[data-icon]').forEach((el) => {
  el.innerHTML = icon(el.dataset.icon);
});

// Хэрэглэгчийн мэдээлэл авах
async function loadUser() {
  try {
    if (urlStudentId) {
      studentId = urlStudentId;
    } else {
      const response = await getCurrentUser();
      if (!response.success) return;
      currentUser = response.data;
      studentId = currentUser.studentId || 1;
    }

    await Promise.all([loadProgress(), loadNextLesson(), loadAttendance()]);
  } catch (error) {
    if (urlStudentId) return; // Бүртгэлийн урсгалаас ирсэн үзэгчийг гаргахгүй
    showToast('Хэрэглэгчийн мэдээлэл ачаалах үед алдаа гарлаа', 'error');
    setTimeout(() => logout(), 2000);
  }
}

// Явц ачаалах (75 цагийн багц)
async function loadProgress() {
  try {
    const response = await getStudentProgress(studentId);
    if (!response.success) return;
    const d = response.data;

    if (d.name) {
      $('greeting').textContent = `Сайн байна уу, ${d.name.trim()}!`;
      $('profile-btn').textContent = d.name.trim().charAt(0) || 'А';
    }

    const pct = Math.max(0, Math.min(100, Math.round(d.progressPercent || 0)));
    const remaining = d.remainingHours ?? Math.max(0, (d.totalHours || 0) - (d.completedHours || 0));

    $('ring-completed').textContent = d.completedHours ?? 0;
    $('ring-total').textContent = `/ ${d.totalHours ?? 75} цаг`;
    $('progress-remaining').textContent =
      `Үлдсэн: ${remaining} цаг (${Math.ceil(remaining / HOURS_PER_LESSON)} хичээл)`;

    const ring = $('progress-ring');
    ring.style.strokeDasharray = RING_CIRCUMFERENCE.toFixed(1);
    ring.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - pct / 100)).toFixed(1);

    // Чөлөөний үлдэгдэл
    const left = Math.max(0, Math.min(LEAVE_TOTAL, d.remainingLeaves ?? LEAVE_TOTAL));
    const used = LEAVE_TOTAL - left;
    $('leave-badge').textContent = `${left}/${LEAVE_TOTAL} үлдсэн`;
    $('leave-bar').style.width = `${(used / LEAVE_TOTAL) * 100}%`;
    $('leave-text').textContent = `${LEAVE_TOTAL} удаагийн чөлөөнөөс ${used} удаа ашигласан`;
  } catch (error) {
    console.error('Явц ачаалах алдаа:', error);
  }
}

// Дараагийн хичээл
async function loadNextLesson() {
  const box = $('next-lesson');
  if (!box) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await getStudentSchedule(studentId, today, nextWeek);

    if (!response.success || !response.data.length) {
      box.innerHTML = '<p class="muted">Товлогдсон хичээл алга байна.</p>';
      return;
    }

    const lesson = response.data[0];
    const start = new Date(lesson.startTime);
    const range = lesson.endTime ? `${fmtTime(start)} – ${fmtTime(lesson.endTime)}` : fmtTime(start);
    const place = [lesson.branch?.name, lesson.room ? `${lesson.room} тоот` : null].filter(Boolean).join(', ') || '—';

    box.innerHTML = `
      <div class="lesson-box">
        <strong>${fmtDate(start)}</strong>
        <span>${DAYS[start.getDay()]}, ${range}</span>
      </div>
      <div class="lesson-line">${icon('user')} ${lesson.teacher?.trim() || '—'}</div>
      <div class="lesson-line">${icon('pin')} ${place}</div>
    `;
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
    box.innerHTML = '<p class="muted">Хуваарь ачаалж чадсангүй.</p>';
  }
}

// Ирцийн түүх
async function loadAttendance() {
  const box = $('attendance-list');
  if (!box) return;
  try {
    const response = await getStudentAttendance(studentId, 9);
    if (!response.success || !response.data.length) {
      box.innerHTML = '<p class="muted">Ирцийн бүртгэл алга байна.</p>';
      return;
    }

    const STATUS = {
      present: ['tag--ok', 'Ирсэн'],
      late: ['tag--leave', 'Хоцорсон'],
      excused: ['tag--leave', 'Чөлөөтэй'],
      leave: ['tag--leave', 'Чөлөөтэй'],
      absent: ['tag--bad', 'Тасалсан'],
    };

    box.innerHTML = response.data
      .map((r) => {
        const [cls, label] = STATUS[r.status] || STATUS.absent;
        const hoursText = r.status === 'present' && r.startTime && r.endTime
          ? `<span class="hours">${Math.round((new Date(r.endTime) - new Date(r.startTime)) / 3600000)} цаг</span>`
          : '';
        return `<div class="log__row">
          <span class="date">${fmtDate(r.date)}</span>
          <span class="meta">${hoursText}<span class="tag ${cls}">${label}</span></span>
        </div>`;
      })
      .join('');
  } catch (error) {
    console.error('Ирц ачаалах алдаа:', error);
    box.innerHTML = '<p class="muted">Ирц ачаалж чадсангүй.</p>';
  }
}

// Гарах товч (avatar)
$('profile-btn')?.addEventListener('click', () => {
  if (confirm('Гарахдаа итгэлтэй байна уу?')) logout();
});

// Одоохондоо холбогдоогүй товчнууд
$('qr-btn')?.addEventListener('click', () => {
  showToast('QR ирцийн бүртгэл удахгүй нэмэгдэнэ', 'info');
});
$('leave-btn')?.addEventListener('click', () => {
  showToast('Чөлөөний хүсэлт удахгүй нэмэгдэнэ', 'info');
});

loadUser();
