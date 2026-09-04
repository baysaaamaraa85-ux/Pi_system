import { getTeachers, normalizeTeacher } from '../services/teacher.service.js';
import { teacherCardHtml } from '../ui/teacher-card.js';
import { showToast } from '../ui/toast.js';
import { showLoading } from '../ui/loading.js';

const container = document.querySelector('#teachers-container');
const countLabel = document.querySelector('#teacher-count');
const searchInput = document.querySelector('input[type="text"]');
const sortSelect = document.querySelector('select');
const specialtyCheckboxes = document.querySelectorAll('.filter-group:first-child input[type="checkbox"]');
const branchCheckboxes = document.querySelectorAll('#branch-filter input[type="checkbox"]');

let allTeachers = [];

// Багш нарыг backend-ээс татах (шүүлтүүр: хичээл, хайлт, эрэмбэ)
async function loadTeachers(filters = {}) {
  if (!container) return;

  showLoading(container);

  try {
    const response = await getTeachers(filters);

    if (!response || !response.success) {
      throw new Error(response?.message || 'Сервер буруу хариу буцаалаа');
    }

    allTeachers = Array.isArray(response.data) ? response.data : [];
    renderGrouped();
  } catch (error) {
    // Backend руу огт холбогдож чадаагүй үед fetch нь TypeError шиднэ
    const offline = error instanceof TypeError;
    const message = offline
      ? 'Backend сервертэй холбогдож чадсангүй. Сервер (localhost:3001) ажиллаж байгаа эсэхийг шалгана уу.'
      : `Багш нарыг ачаалах үед алдаа гарлаа: ${error.message}`;

    showToast(message, 'error');
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:#C83F3F;">
        <p>${message}</p>
        <button id="teachers-retry" style="margin-top:16px;padding:8px 20px;cursor:pointer;">
          Дахин оролдох
        </button>
      </div>
    `;
    const retryBtn = document.querySelector('#teachers-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => loadTeachers(filters));
  }
}

function selectedBranchIds() {
  return Array.from(branchCheckboxes).filter((cb) => cb.checked).map((cb) => cb.value);
}

// Салбар шүүлтүүр нь клиент дээр (аль хэдийн татсан жагсаалт дотор) ажиллана
function renderGrouped() {
  const selected = selectedBranchIds();
  const visible = selected.length
    ? allTeachers.filter((t) => selected.includes(String(t.branchId)))
    : allTeachers;

  if (countLabel) countLabel.textContent = `Нийт ${visible.length} багш бүртгэлтэй`;

  if (visible.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:40px;">Багш олдсонгүй</p>';
    return;
  }

  const groups = new Map();
  visible.forEach((teacher) => {
    const key = teacher.branchName || 'Бусад';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(teacher);
  });

  container.innerHTML = Array.from(groups.entries())
    .map(
      ([branchName, teachers]) => `
        <section class="branch-group">
          <h2 class="branch-title"><span>${branchName} салбар</span><span class="branch-rule"></span></h2>
          <ul class="tcard-grid">
            ${teachers.map(renderCard).join('')}
          </ul>
        </section>
      `,
    )
    .join('');
}

function renderCard(teacher) {
  const t = normalizeTeacher(teacher);
  return teacherCardHtml(t, { href: `teacher-detail.html?id=${t.id}` });
}

// Хайлт
if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadTeachers({ search: e.target.value });
    }, 500);
  });
}

// Эрэмбэлэх
if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    const [sortBy, order] = e.target.value.split('_');
    loadTeachers({ sortBy, order: order || 'DESC' });
  });
}

// Хичээлийн чиглэлийн шүүлтүүр (backend-ээс дахин татна)
specialtyCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const checkedSpecialties = Array.from(specialtyCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.nextSibling.textContent.trim());

    loadTeachers(checkedSpecialties.length > 0 ? { specialty: checkedSpecialties[0] } : {});
  });
});

// Салбарын шүүлтүүр (клиент дээр аль хэдийн байгаа жагсаалтыг л шүүнэ)
branchCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', renderGrouped);
});

// Анхны ачаалт
loadTeachers();
