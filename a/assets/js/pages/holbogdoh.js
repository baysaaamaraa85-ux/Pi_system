import { sendStudyInquiry } from '../services/study.service.js';
import { icon } from '../ui/icons.js';

// Footer-ийн лого/текстийг home.json-оос бөглөх
async function loadFooter() {
  try {
    const response = await fetch('../assets/data/home.json');
    const data = await response.json();
    document.querySelector('#footer-brand').innerHTML = `<span>π</span> ${data.site.brand}`;
    document.querySelector('#footer-text').textContent = `Математикийн бүх төрлийн сургалт • 2–12 анги • ${data.site.phone}`;
  } catch (error) {
    console.error(error);
  }
}

const form = document.querySelector('#study-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const studentName = document.querySelector('#study-name').value.trim();
  const school = document.querySelector('#study-school').value.trim();
  const grade = document.querySelector('#study-grade').value.trim();
  const phone = document.querySelector('#study-phone').value.trim();
  const programInterest = document.querySelector('#study-program').value.trim();
  const note = document.querySelector('#study-note');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!studentName || !phone) {
    note.hidden = false;
    note.textContent = 'Нэр, утасны дугаараа оруулна уу.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Илгээж байна...';

  try {
    const response = await sendStudyInquiry({ studentName, school, grade, phone, programInterest });

    form.querySelectorAll('input').forEach((el) => (el.disabled = true));
    submitBtn.hidden = true;

    note.hidden = false;
    note.textContent = response.message || 'Бид хүлээн авлаа. Удахгүй танд залгах болно.';
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Илгээх ${icon('arrow-right')}`;
    note.hidden = false;
    note.textContent = error.message || 'Илгээхэд алдаа гарлаа. Дахин оролдоно уу.';
  }
});

loadFooter();
