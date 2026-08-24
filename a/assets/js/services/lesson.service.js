import { post } from './api.js';

// Сонгосон хуваарийн цагт сурагчийг бүртгэх
export async function enrollInLesson(lessonId, studentId) {
  return await post(`/lessons/${lessonId}/enroll`, { studentId });
}

// Нэвтэрсэн багш өөрийн хуваарьт шинэ хичээл нэмэх
export async function createLesson({ subject, date, hour, maxStudents }) {
  return await post('/lessons', { subject, date, hour, maxStudents });
}
