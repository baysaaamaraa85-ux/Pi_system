import { getCurrentUser, logout } from '../services/auth.service.js';
import { getTeacherById } from '../services/teacher.service.js';
import { getMyAvailability, saveMyAvailability } from '../services/availability.service.js';
import { getMyEnrollmentRequests, updateEnrollmentRequestStatus } from '../services/enrollment.service.js';
import { showToast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';

// Чимэглэлийн icon-уудыг [data-icon] дээр байрлуулна
document.querySelectorAll('[data-icon]').forEach((el) => {
  el.innerHTML = icon(el.dataset.icon);
});

// Багана: Даваа..Ням (schedule-select.html-тэй ижил дараалал ба дугаар)
const DAYS = [
  { name: 'Даваа', num: 1 },
  { name: 'Мягмар', num: 2 },
  { name: 'Лхагва', num: 3 },
  { name: 'Пүрэв', num: 4 },
  { name: 'Баасан', num: 5 },
  { name: 'Бямба', num: 6 },
  { name: 'Ням', num: 0 },
];

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const DAY_NAME = { 0: 'Ням', 1: 'Даваа', 2: 'Мягмар', 3: 'Лхагва', 4: 'Пүрэв', 5: 'Баасан', 6: 'Бямба' };

let teacherId = null;
const selected = new Set();   // "dayNum|HH:MM"
let savedKeys = new Set();     // backend дээр одоо байгаа

const $ = (id) => document.getElementById(id);
const nextHour = (hhmm) => `${String(Number(hhmm.slice(0, 2)) + 1).padStart(2, '0')}:00`;

// ============================================================
// INIT
// ============================================================
init();

async function init() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Гарахдаа итгэлтэй байна уу?')) logout();
  });

  let user;
  try {
    const res = await getCurrentUser();
    user = res.data;
  } catch (err) {
    // Жинхэнэ нэвтрээгүй үед л login руу шилжүүлнэ
    console.warn('Нэвтрэлт шалгах алдаа:', err);
    window.location.href = 'student-login.html';
    return;
  }

  // Багш биш хэрэглэгчийг өөрийнх нь дашборд руу буцаана (login руу биш — эргэлт үүсгэхгүй)
  if (user.role && user.role !== 'teacher') {
    const home = user.role === 'parent' ? 'parent-dashboard.html' : 'student-dashboard.html';
    showToast('Энэ хуудас зөвхөн багшид зориулагдсан', 'error');
    setTimeout(() => { window.location.href = home; }, 1500);
    return;
  }

  // Багш мөн боловч профайлын teacherId ирээгүй бол (маш ховор) — гаргахгүй, зөвхөн мэдэгдэнэ
  if (!user.teacherId) {
    showToast('Багшийн профайл бүрэн бус байна. Админтай холбогдоно уу.', 'error');
    $('who').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    return;
  }

  teacherId = user.teacherId;
  $('who').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  $('preview-link').href = `schedule-select.html?teacherId=${teacherId}`;

  buildGrid();
  await loadSubjects();
  await loadSaved();
  await loadRequests();

  $('save-btn').addEventListener('click', save);
}

// ============================================================
// ENROLLMENT REQUESTS
// ============================================================
async function loadRequests() {
  const box = $('requests-list');
  try {
    const res = await getMyEnrollmentRequests();
    const list = res.success ? res.data : [];

    if (!list.length) {
      box.innerHTML = '<p class="empty">Одоогоор ирсэн хүсэлт алга байна.</p>';
      return;
    }

    box.innerHTML = list.map(renderRequest).join('');

    box.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => actOnRequest(btn.dataset.id, btn.dataset.act, box));
    });
  } catch (error) {
    console.error('Хүсэлт ачаалах алдаа:', error);
    box.innerHTML = '<p class="empty">Хүсэлтүүдийг ачаалж чадсангүй.</p>';
  }
}

function renderRequest(r) {
  const time = r.startTime ? `${r.dayName} · ${r.startTime}${r.endTime ? '–' + r.endTime : ''}` : '';
  const goals = r.goals && r.goals.length ? ` · ${r.goals.map(esc).join(', ')}` : '';
  const actions =
    r.status === 'pending'
      ? `<div class="req-actions">
           <button class="confirm" data-act="confirmed" data-id="${r.id}">Баталгаажуулах</button>
           <button class="cancel" data-act="cancelled" data-id="${r.id}">Цуцлах</button>
         </div>`
      : '';

  return `
    <div class="req" data-id="${r.id}">
      <div class="req-head">
        <h3>${esc(r.studentName)}</h3>
        <span class="req-status ${r.status}">${esc(r.statusLabel)}</span>
      </div>
      <div class="req-meta">
        <b>Эцэг/эх:</b> ${esc(r.parentName)} · ${esc(r.parentPhone || '')}<br>
        <b>Хуваарь:</b> ${esc(time)}${r.subject ? ' · ' + esc(r.subject) : ''}<br>
        <b>Сурагч:</b> ${r.studentAge ? r.studentAge + ' нас' : ''}${r.studentGrade ? ' · ' + esc(r.studentGrade) : ''}${r.studentSchool ? ' · ' + esc(r.studentSchool) : ''}${goals}<br>
        <b>Багц:</b> ${r.packageHours} цаг — ${Number(r.amount || 0).toLocaleString('mn-MN')}₮
      </div>
      ${actions}
    </div>
  `;
}

async function actOnRequest(id, status, box) {
  const card = box.querySelector(`.req[data-id="${id}"]`);
  card?.querySelectorAll('button').forEach((b) => (b.disabled = true));
  try {
    const res = await updateEnrollmentRequestStatus(id, status);
    if (!res.success) throw new Error(res.message || 'Алдаа гарлаа');
    showToast(res.message || 'Шинэчлэгдлээ', status === 'confirmed' ? 'success' : 'info');
    await loadRequests();
  } catch (error) {
    console.error('Хүсэлт шинэчлэх алдаа:', error);
    showToast(error.message || 'Шинэчлэхэд алдаа гарлаа', 'error');
    card?.querySelectorAll('button').forEach((b) => (b.disabled = false));
  }
}

// ============================================================
// SUBJECTS
// ============================================================
async function loadSubjects() {
  const sel = $('subject');
  try {
    const res = await getTeacherById(teacherId);
    const list = res.success && Array.isArray(res.data.specialties) ? res.data.specialties : [];
    sel.innerHTML =
      '<option value="">Хичээл сонгох</option>' +
      list.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  } catch {
    /* хоосон үлдээнэ */
  }
}

// ============================================================
// GRID
// ============================================================
function buildGrid() {
  const grid = $('grid');

  let html = '<thead><tr><th></th>' + DAYS.map((d) => `<th>${d.name}</th>`).join('') + '</tr></thead><tbody>';

  for (const time of TIME_SLOTS) {
    html += `<tr><td class="time">${time}</td>`;
    for (const d of DAYS) {
      const key = `${d.num}|${time}`;
      html += `<td><button type="button" class="slot" data-key="${key}" title="${d.name} ${time}">${time}</button></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';
  grid.innerHTML = html;

  grid.querySelectorAll('.slot').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (selected.has(key)) {
        selected.delete(key);
        btn.classList.remove('on');
      } else {
        selected.add(key);
        btn.classList.add('on');
      }
      btn.classList.remove('saved-mark');
    });
  });
}

function paintSelection() {
  $('grid').querySelectorAll('.slot').forEach((btn) => {
    const key = btn.dataset.key;
    btn.classList.toggle('on', selected.has(key));
    btn.classList.toggle('saved-mark', savedKeys.has(key) && selected.has(key));
  });
}

// ============================================================
// LOAD SAVED
// ============================================================
async function loadSaved() {
  try {
    const res = await getMyAvailability();
    const slots = res.success ? res.data : [];

    selected.clear();
    savedKeys = new Set();
    for (const s of slots) {
      const key = `${s.dayOfWeek}|${s.startTime}`;
      selected.add(key);
      savedKeys.add(key);
    }

    if (slots.length) {
      const withSubject = slots.find((s) => s.subject);
      if (withSubject) $('subject').value = withSubject.subject;
      $('capacity').value = slots[0].maxStudents || 6;
    }

    paintSelection();
    renderSaved(slots);
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
    $('saved-summary').innerHTML = '<p class="empty">Хуваарь ачаалж чадсангүй.</p>';
  }
}

function renderSaved(slots) {
  const box = $('saved-summary');
  if (!slots.length) {
    box.innerHTML = '<p class="empty">Одоогоор нээлттэй цаг алга. Дээрх хүснэгтээс сонгоод хадгална уу.</p>';
    return;
  }

  const byDay = new Map();
  for (const s of slots) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
    byDay.get(s.dayOfWeek).push(s.startTime);
  }

  const order = [1, 2, 3, 4, 5, 6, 0];
  box.innerHTML = order
    .filter((d) => byDay.has(d))
    .map((d) => {
      const times = byDay.get(d).sort().join(', ');
      return `<div class="summary-row"><span class="chip">${DAY_NAME[d]}</span> <span style="font-size:13.5px;color:#3a3a3a">${times}</span></div>`;
    })
    .join('');
}

// ============================================================
// SAVE
// ============================================================
async function save() {
  const subject = $('subject').value.trim();
  const maxStudents = Number($('capacity').value) || 6;

  if (selected.size === 0) {
    showToast('Эхлээд боломжтой цаг сонгоно уу', 'error');
    return;
  }
  if (!subject) {
    showToast('Хичээлээ сонгоно уу', 'error');
    return;
  }
  if (maxStudents < 1 || maxStudents > 20) {
    showToast('Багтаамж 1-20 хооронд байна', 'error');
    return;
  }

  const slots = [...selected].map((key) => {
    const [day, start] = key.split('|');
    return { dayOfWeek: Number(day), startTime: start, endTime: nextHour(start) };
  });

  const btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = 'Хадгалж байна…';

  try {
    const res = await saveMyAvailability({ subject, maxStudents, slots });
    if (!res.success) throw new Error(res.message || 'Алдаа гарлаа');
    showToast(res.message || 'Хуваарь хадгалагдлаа', 'success');
    await loadSaved();
  } catch (error) {
    console.error('Хуваарь хадгалах алдаа:', error);
    showToast(error.message || 'Хадгалахад алдаа гарлаа', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Хуваарь хадгалах';
  }
}

// ============================================================
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
