import { getCurrentUser, logout } from '../services/auth.service.js';
import { getTeacherById } from '../services/teacher.service.js';
import { getMyAvailability, saveMyAvailability } from '../services/availability.service.js';
import { showToast } from '../ui/toast.js';

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
  } catch {
    window.location.href = 'student-login.html';
    return;
  }

  if (user.role !== 'teacher' || !user.teacherId) {
    showToast('Энэ хуудас зөвхөн багшид зориулагдсан', 'error');
    setTimeout(() => { window.location.href = 'student-login.html'; }, 1500);
    return;
  }

  teacherId = user.teacherId;
  $('who').textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  $('preview-link').href = `schedule-select.html?teacherId=${teacherId}`;

  buildGrid();
  await loadSubjects();
  await loadSaved();

  $('save-btn').addEventListener('click', save);
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
