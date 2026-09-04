import { getStudentProgress, getStudentSchedule, getStudentAttendance } from '../services/student.service.js';
import { getCurrentUser, logout } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';
import { showLoading } from '../ui/loading.js';
import { icon } from '../ui/icons.js';

let currentUser = null;
let studentId = null;

// Бүртгэлийн урсгалаас (payment-success.html) шууд ирсэн бол яг тэр хүүхдийн ID-г ашиглана
const urlStudentId = new URLSearchParams(window.location.search).get('studentId');

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

    // Бүх өгөгдөл ачаалах
    await Promise.all([
      loadProgress(),
      loadNextLesson(),
      loadAttendance()
    ]);
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
    
    if (response.success) {
      const data = response.data;

      // Дэлгэцийн мэндчилгээ (сурагчийн өөрийнх нь нэрээр)
      const titleEl = document.querySelector('.title h1');
      if (titleEl && data.name) {
        titleEl.textContent = `Сайн байна уу, ${data.name.trim()}!`;
      }

      // Progress circle
      const progressCircle = document.querySelector('.progress-circle');
      if (progressCircle) {
        progressCircle.textContent = `${data.completedHours}/${data.totalHours}`;
      }
      
      // Үлдсэн цаг
      const remainingText = document.querySelector('.card p');
      if (remainingText) {
        remainingText.textContent = `Үлдсэн: ${data.remainingHours} цаг`;
      }
      
      // Чөлөөний үлдэгдэл
      const leavesCard = document.querySelector('.card:has(h2:contains("Чөлөөний үлдэгдэл"))');
      if (leavesCard) {
        const leavesCount = leavesCard.querySelector('h3');
        if (leavesCount) {
          leavesCount.textContent = `${5 - data.remainingLeaves} / 5`;
        }
        
        const leavesText = leavesCard.querySelector('p');
        if (leavesText) {
          leavesText.textContent = `5 удаагийн чөлөөнөөс ${5 - data.remainingLeaves} ашигласан`;
        }
        
        // Progress bar
        const bar = leavesCard.querySelector('.bar div');
        if (bar) {
          bar.style.width = `${((5 - data.remainingLeaves) / 5) * 100}%`;
        }
      }
    }
  } catch (error) {
    console.error('Явц ачаалах алдаа:', error);
  }
}

// Дараагийн хичээл
async function loadNextLesson() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await getStudentSchedule(studentId, today, nextWeek);
    
    if (response.success && response.data.length > 0) {
      const nextLesson = response.data[0];
      
      const infoCard = document.querySelector('.card.info');
      if (infoCard) {
        const date = new Date(nextLesson.startTime);
        const days = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
        
        infoCard.innerHTML = `
          <h2>Дараагийн хичээл</h2>
          <p>${icon('calendar')} ${date.toLocaleDateString('mn-MN')}</p>
          <p>${icon('clock')} ${days[date.getDay()]} ${date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>${icon('teacher')} ${nextLesson.teacher}</p>
          <p>${icon('pin')} ${nextLesson.branch.name}</p>
        `;
      }
    }
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
  }
}

// Ирцийн түүх
async function loadAttendance() {
  try {
    const response = await getStudentAttendance(studentId, 3);
    
    if (response.success && response.data.length > 0) {
      const historyCard = document.querySelector('.card:has(h2:contains("Ирцийн түүх"))');
      if (historyCard) {
        const historyHTML = response.data.map(record => {
          const date = new Date(record.date).toLocaleDateString('mn-MN');
          const statusClass = record.status === 'present' ? 'green' : 'red';
          const statusText = record.status === 'present' ? 'Ирсэн' : 'Тасалсан';
          
          return `
            <div class="history">
              <span>${date}</span>
              <span class="${statusClass}">${statusText}</span>
            </div>
          `;
        }).join('');
        
        historyCard.querySelector('h2').insertAdjacentHTML('afterend', historyHTML);
      }
    }
  } catch (error) {
    console.error('Ирц ачаалах алдаа:', error);
  }
}

// Гарах товч
const logoutBtn = document.querySelector('.profile');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Гарахдаа итгэлтэй байна уу?')) {
      logout();
    }
  });
}

// Ачаалах
loadUser();
