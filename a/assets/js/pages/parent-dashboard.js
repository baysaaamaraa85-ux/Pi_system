import { getStudentProgress, getStudentSchedule } from '../services/student.service.js';
import { getCurrentUser, logout } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';

let currentUser = null;
let studentId = 1; // Эцэг эхийн хүүхдийн ID

// Хэрэглэгчийн мэдээлэл авах
async function loadUser() {
  try {
    const response = await getCurrentUser();
    if (response.success) {
      currentUser = response.data;
      
      // Нэр харуулах
      const titleEl = document.querySelector('.page-head h1');
      if (titleEl) {
        titleEl.textContent = `Сайн байна уу, ${currentUser.firstName} аа!`;
      }
      
      // Өгөгдөл ачаалах
      await Promise.all([
        loadStudentProgress(),
        loadNextLesson(),
        loadNotifications(),
        loadPayments()
      ]);
    }
  } catch (error) {
    showToast('Хэрэглэгчийн мэдээлэл ачаалах үед алдаа гарлаа', 'error');
    setTimeout(() => logout(), 2000);
  }
}

// Хүүхдийн явц
async function loadStudentProgress() {
  try {
    const response = await getStudentProgress(studentId);
    
    if (response.success) {
      const data = response.data;
      
      // Явцын карт
      const progressCard = document.querySelector('.card:first-child');
      if (progressCard) {
        const progressBar = progressCard.querySelector('.progress-bar span');
        if (progressBar) {
          progressBar.style.width = `${data.progressPercent}%`;
        }
        
        const hoursText = progressCard.querySelector('.progress-row strong');
        if (hoursText) {
          hoursText.textContent = `${data.completedHours} / ${data.totalHours} цаг`;
        }
        
        const remainingText = progressCard.querySelector('.muted');
        if (remainingText) {
          remainingText.textContent = `Үлдсэн: ${data.remainingHours} цаг · Ойролцоогоор ${Math.ceil(data.remainingHours / 3)} хичээл`;
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
      const lessonDate = new Date(nextLesson.startTime);
      const today = new Date();
      const daysUntil = Math.ceil((lessonDate - today) / (1000 * 60 * 60 * 24));
      
      const lessonCard = document.querySelector('.card:nth-child(3)');
      if (lessonCard) {
        const countEl = lessonCard.querySelector('.next-lesson__count');
        if (countEl) {
          countEl.textContent = `${daysUntil} өдөр`;
        }
        
        const dateEl = lessonCard.querySelector('.muted:first-of-type');
        if (dateEl) {
          const days = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
          dateEl.textContent = `${lessonDate.toLocaleDateString('mn-MN')} · ${days[lessonDate.getDay()]}`;
        }
        
        const timeEl = lessonCard.querySelector('.next-lesson__time');
        if (timeEl) {
          const startTime = new Date(nextLesson.startTime);
          const endTime = new Date(nextLesson.endTime);
          timeEl.textContent = `${startTime.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}`;
        }
      }
    }
  } catch (error) {
    console.error('Хуваарь ачаалах алдаа:', error);
  }
}

// Мэдэгдлүүд (статик өгөгдөл одоогоор)
async function loadNotifications() {
  // Backend-д notifications API нэмэх хэрэгтэй
  console.log('Мэдэгдлүүд ачаалагдлаа');
}

// Төлбөрийн түүх (статик өгөгдөл одоогоор)
async function loadPayments() {
  // Backend-д payments API нэмэх хэрэгтэй
  console.log('Төлбөрийн түүх ачаалагдлаа');
}

// Хүүхэд солих
document.querySelectorAll('.child-chip').forEach(chip => {
  chip.addEventListener('click', function() {
    document.querySelectorAll('.child-chip').forEach(c => c.classList.remove('is-active'));
    this.classList.add('is-active');
    
    // Өөр хүүхдийн өгөгдөл ачаалах
    showToast('Хүүхэд солигдлоо', 'info');
  });
});

// Sidebar navigation
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', function(e) {
    if (this.getAttribute('href').startsWith('./')) {
      // Бусад хуудас руу шилжих
      return;
    }
    e.preventDefault();
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('is-active'));
    this.classList.add('is-active');
  });
});

// Гарах
const backBtn = document.querySelector('.sidebar-back');
if (backBtn) {
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Гарахдаа итгэлтэй байна уу?')) {
      logout();
    }
  });
}

// Ачаалах
loadUser();
