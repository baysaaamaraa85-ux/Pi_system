import { get } from './api.js';

// Сурагчийн явц (75 цагийн багц)
export async function getStudentProgress(studentId) {
  return await get(`/students/${studentId}/progress`);
}

// Сурагчийн хуваарь
export async function getStudentSchedule(studentId, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const query = params.toString();
  return await get(`/students/${studentId}/schedule${query ? '?' + query : ''}`);
}

// Ирцийн түүх
export async function getStudentAttendance(studentId, limit = 20) {
  return await get(`/students/${studentId}/attendance?limit=${limit}`);
}
