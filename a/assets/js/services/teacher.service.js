import { get } from './api.js';

// Бүх багш нарын жагсаалт
export async function getTeachers(filters = {}) {
  const params = new URLSearchParams();

  // Шүүлтүүр нэмэх
  if (filters.specialty) params.append('specialty', filters.specialty);
  if (filters.branchId) params.append('branchId', filters.branchId);
  if (filters.minRating) params.append('minRating', filters.minRating);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const query = params.toString();
  return await get(`/teachers${query ? '?' + query : ''}`);
}

// Нэг багшийн дэлгэрэнгүй
export async function getTeacherById(id) {
  return await get(`/teachers/${id}`);
}

// Багшийн хуваарь
export async function getTeacherSchedule(id, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const query = params.toString();
  return await get(`/teachers/${id}/schedule${query ? '?' + query : ''}`);
}
