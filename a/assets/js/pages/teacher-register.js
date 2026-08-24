import { register } from '../services/auth.service.js';
import { getBranches } from '../services/branch.service.js';
import { showToast } from '../ui/toast.js';

// Салбаруудыг сонголтод ачаалах
async function loadBranches() {
  const select = document.getElementById('tr-branch');
  try {
    const response = await getBranches();
    if (response.success) {
      response.data.forEach((branch) => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = branch.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Салбар ачаалах алдаа:', error);
  }
}

const submitBtn = document.getElementById('tr-submit');

submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const name = document.getElementById('tr-name').value.trim() || 'Тест Багш';
  const phone = document.getElementById('tr-phone').value.trim() || String(90000000 + Math.floor(Math.random() * 9999999));
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const enteredEmail = document.getElementById('tr-email').value.trim();
  const email = emailRegex.test(enteredEmail) ? enteredEmail : `teacher${Date.now()}@pitoo.mn`;
  const password = document.getElementById('tr-password').value.trim() || '123456';
  const experienceYears = parseFloat(document.getElementById('tr-experience').value) || 1;
  const branchId = document.getElementById('tr-branch').value || null;
  const bio = document.getElementById('tr-bio').value.trim() || '';

  const specialties = Array.from(document.querySelectorAll('#tr-specialties input:checked')).map((cb) => cb.value);
  if (specialties.length === 0) specialties.push('Монгол математик');

  const [lastName, firstName] = name.split(/\s+/);

  submitBtn.disabled = true;
  const link = submitBtn.querySelector('a');
  const originalText = link.textContent;
  link.textContent = 'Бүртгэж байна...';

  try {
    const response = await register({
      email,
      password,
      firstName: firstName || name,
      lastName: lastName || '',
      phone,
      role: 'teacher',
      specialties,
      experienceYears,
      bio,
      branchId,
    });

    if (response.success) {
      showToast('Профайл амжилттай үүслээ!', 'success');
      setTimeout(() => {
        window.location.href = 'teacher-dashboard.html';
      }, 800);
    }
  } catch (error) {
    showToast(error.message || 'Бүртгэл үүсгэх үед алдаа гарлаа', 'error');
    submitBtn.disabled = false;
    link.textContent = originalText;
  }
});

loadBranches();
