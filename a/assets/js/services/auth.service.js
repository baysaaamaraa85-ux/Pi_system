import { post, get, auth } from './api.js';

// Нэвтрэх
export async function login(email, password) {
  const data = await post('/auth/login', { email, password });
  
  if (data.success && data.data.token) {
    auth.setToken(data.data.token);
  }
  
  return data;
}

// Бүртгүүлэх
export async function register(userData) {
  const data = await post('/auth/register', userData);
  
  if (data.success && data.data.token) {
    auth.setToken(data.data.token);
  }
  
  return data;
}

// Гарах
export function logout() {
  auth.removeToken();
  window.location.href = '/pages/student-login.html';
}

// Одоогийн хэрэглэгч
export async function getCurrentUser() {
  if (!auth.isAuthenticated()) {
    throw new Error('Нэвтрээгүй байна');
  }
  
  return await get('/auth/me');
}

// Нэвтэрсэн эсэхийг шалгах
export function checkAuth() {
  return auth.isAuthenticated();
}
