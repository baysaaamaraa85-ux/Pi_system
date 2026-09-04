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

// Багшийн зургийн замыг frontend root (`a/`)-оос эхлэх абсолют зам болгож,
// аль ч хуудаснаас (нүүр эсвэл /pages/*) ижил ажиллахаар нэгтгэнэ
export function resolveTeacherPhoto(photo) {
  if (!photo) return '';
  if (/^https?:\/\//.test(photo)) return photo;
  return photo.startsWith('/') ? photo : `/${photo}`;
}

// API эсвэл home.json-оос ирсэн багшийн өгөгдлийг бүх хуудсанд ашиглах нэг хэлбэрт оруулна
export function normalizeTeacher(raw = {}) {
  const name = (raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`).trim();

  return {
    id: raw.id,
    name,
    firstName: raw.firstName || name,
    specialties: Array.isArray(raw.specialties) ? raw.specialties : [],
    rating: raw.rating != null && raw.rating !== '' ? Number(raw.rating) : null,
    experienceYears:
      raw.experienceYears != null && raw.experienceYears !== '' ? Number(raw.experienceYears) : null,
    branchId: raw.branchId ?? null,
    branchName: raw.branchName || '',
    bio: raw.bio || '',
    photo: resolveTeacherPhoto(raw.photo || raw.photoUrl),
    avatarInitial: (raw.firstName || name || '?').trim().charAt(0).toUpperCase() || '?',
  };
}
