// Бүртгэлийн wizard-ийн эцсийн хуудас.
// payment.html-ээс localStorage-д үлдээсэн хүсэлтийн хураангуйг харуулна.

const LEVEL_LABELS = {
  beginner: 'Анхан',
  intermediate: 'Дунд',
  advanced: 'Ахисан',
  olympiad: 'Олимпиадын түвшин',
};

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

const result = readJson('piTooEnrollmentResult');
const registration = readJson('piTooRegistration');

// Хүсэлт үүсээгүй бол эхнээс нь эхлүүлнэ
if (!result.id && !registration.availabilityId) {
  window.location.href = 'branch-select.html';
}

const teacherName =
  result.teacherName || registration.teacherName || '—';

const schedule = registration.selectedSchedule || {};
const dayName = result.dayName || schedule.dayName || '';
const startTime = result.startTime || schedule.startTime || '';
const endTime = result.endTime || schedule.endTime || '';
const subject = result.subject || schedule.subject || '';

const scheduleLabel = dayName && startTime
  ? `${dayName} · ${startTime}${endTime ? ' – ' + endTime : ''}${subject ? ' | ' + subject : ''}`
  : '—';

const branchName = result.branchName || registration.branchName || '';
const hours = result.packageHours || 75;
const amount = Number(result.amount || 450000).toLocaleString('mn-MN');
const level = registration.level ? LEVEL_LABELS[registration.level] || registration.level : '';

const programLabel =
  `${hours} цагийн багц — ${amount}₮` +
  (branchName ? ` · ${branchName}` : '') +
  (level ? ` · ${level}` : '');

const set = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

set('success-teacher', teacherName);
set('success-schedule', scheduleLabel);
set('success-program', programLabel);

// Хүсэлтийн дугаарыг гарчигт нэмнэ
if (result.id) {
  const p = document.querySelector('.success-section p');
  if (p) {
    p.textContent =
      `Таны бүртгэлийн хүсэлт (#${result.id}) хүлээн авлаа. ` +
      'Ажилтан удахгүй холбогдож төлбөр болон хуваарийг баталгаажуулна.';
  }
}

const btn = document.getElementById('go-dashboard-btn');
if (btn) {
  btn.textContent = 'Нүүр хуудас руу буцах';
  btn.addEventListener('click', () => {
    // Wizard-ийн түр төлөвийг цэвэрлэнэ
    [
      'piTooRegistration',
      'piTooEnrollmentResult',
      'piTooPaymentId',
      'piTooTeacherId',
      'piTooAvailabilityId',
    ].forEach((k) => localStorage.removeItem(k));

    window.location.href = '../index.html';
  });
}
