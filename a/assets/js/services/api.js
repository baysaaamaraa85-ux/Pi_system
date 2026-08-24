// API холболтын үндсэн тохиргоо
const API_BASE_URL = 'http://localhost:3001/api';

// LocalStorage-аас token авах
const getToken = () => localStorage.getItem('token');

// LocalStorage-д token хадгалах
const setToken = (token) => localStorage.setItem('token', token);

// Token устгах
const removeToken = () => localStorage.removeItem('token');

// Үндсэн fetch wrapper - бүх API дуудлагад ашиглана
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Алдаа гарлаа');
    }

    return data;
  } catch (error) {
    console.error('API алдаа:', error);
    throw error;
  }
}

// GET хүсэлт
export const get = (endpoint) => apiRequest(endpoint, { method: 'GET' });

// POST хүсэлт
export const post = (endpoint, body) => 
  apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });

// PUT хүсэлт
export const put = (endpoint, body) =>
  apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

// DELETE хүсэлт
export const del = (endpoint) => apiRequest(endpoint, { method: 'DELETE' });

// Token удирдлага
export const auth = {
  setToken,
  getToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};
