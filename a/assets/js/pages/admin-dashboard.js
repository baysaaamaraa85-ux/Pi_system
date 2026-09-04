import { getCurrentUser, logout } from '../services/auth.service.js';
import {
  getAdminStats,
  getAdminWeeklyAttendance,
  getAdminPaymentStatus,
  getAdminRecentStudents,
} from '../services/admin.service.js';
import { showToast } from '../ui/toast.js';
import { icon } from '../ui/icons.js';

const $ = (id) => document.getElementById(id);

// Чимэглэлийн icon-ууд
document.querySelectorAll('[data-icon]').forEach((el) => {
  const label = el.classList.contains('status-badge') ? ' Идэвхтэй' : '';
  el.innerHTML = icon(el.dataset.icon) + label;
});

const fmtMoney = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M₮`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K₮`;
  return `${n}₮`;
};

async function init() {
  let user;
  try {
    const res = await getCurrentUser();
    user = res.data;
  } catch {
    window.location.href = 'student-login.html';
    return;
  }

  if (user.role !== 'admin') {
    showToast('Энэ хуудас зөвхөн админд зориулагдсан', 'error');
    const home = user.role === 'teacher' ? 'teacher-dashboard.html'
      : user.role === 'parent' ? 'parent-dashboard.html'
      : 'student-dashboard.html';
    setTimeout(() => { window.location.href = home; }, 1500);
    return;
  }

  $('profile-btn').textContent = (user.firstName || 'A').trim().charAt(0) || 'A';

  loadStats();
  loadWeekly();
  loadPaymentStatus();
  loadRecent();
}

async function loadStats() {
  try {
    const { success, data } = await getAdminStats();
    if (!success) return;
    $('stat-students').textContent = data.totalStudents;
    $('stat-teachers').textContent = data.activeTeachers;
    $('stat-attendance').textContent = `${data.attendanceRate}%`;
    $('stat-revenue').textContent = fmtMoney(data.monthlyRevenue);
  } catch (e) {
    console.error('stats', e);
  }
}

async function loadWeekly() {
  const box = $('chart-bars');
  try {
    const { success, data } = await getAdminWeeklyAttendance();
    if (!success || !data.length) { box.innerHTML = '<p class="muted">Мэдээлэл алга.</p>'; return; }

    const max = Math.max(1, ...data.map((d) => Math.max(d.present, d.absent)));
    box.innerHTML = data.map((d) => `
      <div class="bar-group">
        <div class="bar-group__bars">
          <div class="bar bar--present" style="height:${(d.present / max) * 100}%" title="Ирсэн: ${d.present}"></div>
          <div class="bar bar--absent" style="height:${(d.absent / max) * 100}%" title="Ирээгүй: ${d.absent}"></div>
        </div>
        <span class="bar-group__label">${d.label}</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('weekly', e);
    box.innerHTML = '<p class="muted">Ачаалж чадсангүй.</p>';
  }
}

async function loadPaymentStatus() {
  try {
    const { success, data } = await getAdminPaymentStatus();
    if (!success) return;

    const segments = [
      { label: 'Төлсөн', value: data.paid, color: 'var(--color-success)' },
      { label: 'Хүлээгдэж буй', value: data.pending, color: 'var(--color-accent)' },
      { label: 'Буцаасан', value: data.refunded, color: 'var(--color-danger)' },
    ];
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;

    let offset = 25; // 12 цагийн байрлалаас эхлэх
    const rings = segments.map((s) => {
      const pct = (s.value / total) * 100;
      const dash = `${pct} ${100 - pct}`;
      const el = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${s.color}" stroke-width="5.5"
        stroke-dasharray="${dash}" stroke-dashoffset="${offset}"></circle>`;
      offset -= pct;
      return el;
    }).join('');

    $('chart-donut').innerHTML = `
      <svg width="150" height="150" viewBox="0 0 42 42" style="transform:rotate(-90deg)">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--color-panel-warm-3)" stroke-width="5.5"></circle>
        ${rings}
      </svg>`;

    $('donut-legend').innerHTML = segments.map((s) => `
      <li><i class="dot dot--${s.label === 'Төлсөн' ? 'green' : s.label === 'Хүлээгдэж буй' ? 'gold' : 'rose'}"></i>
      ${s.label} <b>${s.value}</b></li>
    `).join('');
  } catch (e) {
    console.error('payment-status', e);
  }
}

async function loadRecent() {
  const body = $('recent-rows');
  try {
    const { success, data } = await getAdminRecentStudents();
    if (!success || !data.length) {
      body.innerHTML = '<tr><td colspan="5" class="muted">Бүртгэл алга байна.</td></tr>';
      return;
    }
    body.innerHTML = data.map((r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.teacher}</td>
        <td>${r.branch}</td>
        <td>${r.attendanceRate === null ? '—' : r.attendanceRate + '%'}</td>
        <td><span class="tag">${r.status}</span></td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('recent', e);
    body.innerHTML = '<tr><td colspan="5" class="muted">Ачаалж чадсангүй.</td></tr>';
  }
}

$('profile-btn')?.addEventListener('click', () => {
  if (confirm('Гарахдаа итгэлтэй байна уу?')) logout();
});

init();
