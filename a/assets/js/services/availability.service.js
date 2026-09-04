import { get, put } from './api.js';

// Тухайн багшийн нээлттэй цагууд (нээлттэй — бүртгэлийн flow ашиглана)
export async function getTeacherAvailability(teacherId) {
  return get(`/availability/teacher/${encodeURIComponent(teacherId)}`);
}

// Нэвтэрсэн багшийн өөрийн нээлттэй цагууд
export async function getMyAvailability() {
  return get('/availability/me');
}

// Багшийн хуваарийг бүхэлд нь солих
// payload: { subject, maxStudents, slots: [{ dayOfWeek, startTime, endTime }] }
export async function saveMyAvailability(payload) {
  return put('/availability/me', payload);
}
