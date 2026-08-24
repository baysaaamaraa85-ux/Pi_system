import { login } from '../services/auth.service.js';
import { showToast } from '../ui/toast.js';

// Нэвтрэх форм
const loginForm = document.getElementById('loginBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userTypeSelect = document.getElementById('user-type');

if (loginForm) {
  loginForm.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validation
    if (!email || !password) {
      showToast('И-мэйл болон нууц үг оруулна уу', 'error');
      return;
    }
    
    // Loading state
    loginForm.disabled = true;
    loginForm.textContent = 'Нэвтэрч байна...';
    
    try {
      const response = await login(email, password);
      
      if (response.success) {
        showToast('Амжилттай нэвтэрлээ!', 'success');
        
        // Хэрэглэгчийн төрлөөс хамааран redirect хийх
        const role = response.data.user.role;
        
        setTimeout(() => {
          switch (role) {
            case 'student':
              window.location.href = '/pages/student-dashboard.html';
              break;
            case 'teacher':
              window.location.href = '/pages/teacher-dashboard.html';
              break;
            case 'parent':
              window.location.href = '/pages/parent-dashboard.html';
              break;
            default:
              window.location.href = '/index.html';
          }
        }, 500);
      }
    } catch (error) {
      showToast(error.message || 'Нэвтрэх үед алдаа гарлаа', 'error');
      loginForm.disabled = false;
      loginForm.textContent = 'Нэвтрэх';
    }
  });
}

// Хэрэглэгчийн төрлөөс хамааран "Бүртгэлгүй бол..." холбоосыг тохирох урсгал руу чиглүүлнэ
const registerLink = document.getElementById('register-link');
if (userTypeSelect && registerLink) {
  userTypeSelect.addEventListener('change', () => {
    registerLink.href = userTypeSelect.value === 'Багш' ? 'teacher-register.html' : 'branch-select.html';
  });
}

// Нууц үг харуулах/нуух
window.togglePass = function() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
};
