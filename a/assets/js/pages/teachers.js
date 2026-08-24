import { getTeachers } from '../services/teacher.service.js';
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

    if (response.success) {
      allTeachers = response.data;
      renderGrouped();
    }
  } catch (error) {
    showToast('Багш нарыг ачаалах үед алдаа гарлаа', 'error');
    container.innerHTML = '<p style="text-align:center;padding:40px;color:red;">Алдаа гарлаа</p>';
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

  countLabel.textContent = `Нийт ${visible.length} багш бүртгэлтэй`;

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
          <h2 class="branch-title">${branchName}</h2>
          <div class="teacher-grid">
            ${teachers.map(renderCard).join('')}
          </div>
        </section>
      `,
    )
    .join('');
}

function renderCard(teacher) {
  const initial = teacher.firstName?.charAt(0) || '?';

  return `
    <div class="card">
      <div class="avatar-box">
        ${teacher.photoUrl
          ? `<img src="..${teacher.photoUrl}" alt="${teacher.name}" class="avatar-photo"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="avatar" style="${teacher.photoUrl ? 'display:none' : ''}">${initial}</div>
      </div>

      <h3 class="card-name">${teacher.name}</h3>
      <p class="card-specialty">${teacher.specialties.join(' · ')}</p>

      <button onclick="window.location.href='teacher-detail.html?id=${teacher.id}'">Дэлгэрэнгүй →</button>
    </div>
  `;
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
