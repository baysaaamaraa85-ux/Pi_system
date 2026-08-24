import { register } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';

// teacher-detail.html-с "Энэ багшийг сонгох" дарж ирсэн бол — салбар аль хэдийн тодорхой тул баталгаажуулах бичиг харуулна
const incomingTeacherId = new URLSearchParams(window.location.search).get('teacherId');

if (incomingTeacherId) {
  const titleSection = document.querySelector('.title');
  if (titleSection) {
    const note = document.createElement('p');
    note.style.cssText = 'margin-top:10px;font-size:14px;color:#1d7a46;font-weight:600;';
    note.textContent = '✓ Багш сонгогдсон — анкетаа бөглөөд үргэлжлүүлээрэй';
    titleSection.appendChild(note);
  }
}

// Бүртгүүлэх форм
const nextBtn = document.querySelector('.next');

if (nextBtn) {
  nextBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Эцэг эхийн мэдээлэл (дэмо горим — дутуу бол автоматаар бөглөнө, алхмыг блоклохгүй)
    const parentInputs = document.querySelectorAll('.card:first-child input');
    const parentName = parentInputs[0]?.value.trim() || 'Тест Хэрэглэгч';
    const parentPhone = parentInputs[1]?.value.trim() || String(90000000 + Math.floor(Math.random() * 9999999));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const enteredEmail = parentInputs[2]?.value.trim();
    const parentEmail = emailRegex.test(enteredEmail) ? enteredEmail : `test${Date.now()}@pitoo.mn`;

    // Хүүхдийн мэдээлэл (дэмо горим)
    const childInputs = document.querySelectorAll('.card:nth-child(2) input');
    const childName = childInputs[0]?.value.trim() || 'Тест Сурагч';
    const childAge = childInputs[1]?.value.trim() || '10';
    const childGrade = childInputs[2]?.value.trim() || '5-р анги';
    const childSchool = childInputs[3]?.value.trim() || 'Тест сургууль';

    // Нууц үг үүсгэх (жишээ: phone-ийн сүүлийн 6 орон)
    const password = parentPhone.slice(-6) || '123456';
    
    // Нэрийг задлах (Овог, Нэр)
    const [lastName, firstName] = parentName.split(/\s+/);
    const [childLastName, childFirstName] = childName.split(/\s+/);
    
    // Шалгалтын тэмдэглэл (багш дараа нь бөглөнө, одоохондоо хоосон байж болно)
    const assessmentNote = document.querySelector('#assessment-note')?.value.trim() || '';

    // Хөтөлбөр ба багц
    const programType = document.querySelector('input[name="programType"]:checked')?.value || 'mongolian';
    const billingType = document.querySelector('input[name="billingType"]:checked')?.value || 'package';
    
    // Loading state
    nextBtn.disabled = true;
    const originalText = nextBtn.textContent;
    nextBtn.textContent = 'Бүртгэж байна...';
    
    try {
      // Эцэг эх бүртгүүлэх
      const response = await register({
        email: parentEmail,
        password: password,
        firstName: firstName || parentName,
        lastName: lastName || '',
        phone: parentPhone,
        role: 'parent',
        // Хүүхдийн мэдээлэл (backend-д нэмэлт боловсруулалт хийх хэрэгтэй)
        childData: {
          firstName: childFirstName || childName,
          lastName: childLastName || '',
          age: parseInt(childAge),
          grade: childGrade,
          school: childSchool,
          assessmentNote: assessmentNote
        }
      });

      if (response.success) {
        showToast('Амжилттай бүртгэгдлээ!', 'success');

        // Дараагийн алхмуудад хэрэгтэй мэдээллийг хадгалаад шилжих
        sessionStorage.setItem('pendingEnrollment', JSON.stringify({
          studentId: response.data.studentId,
          programType,
          billingType,
          teacherId: incomingTeacherId || null,
        }));

        // teacher-detail.html-с багшаа аль хэдийн сонгосон бол Багш алхмыг алгасаад шууд Хуваарь руу
        const nextUrl = incomingTeacherId
          ? `schedule-select.html?teacherId=${incomingTeacherId}`
          : 'teacher-select.html';

        setTimeout(() => {
          window.location.href = nextUrl;
        }, 1000);
      }
    } catch (error) {
      showToast(error.message || 'Бүртгэл үүсгэх үед алдаа гарлаа', 'error');
      nextBtn.disabled = false;
      nextBtn.textContent = originalText;
    }
  });
}

// Өмнөх товч
const prevBtn = document.querySelector('.prev');
if (prevBtn) {
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'branch-select.html';
  });
}
