import { post } from './api.js';

// "Суралцах эхний алхмаа хийе" хуудасны хүсэлт илгээх
export async function sendStudyInquiry({ studentName, school, grade, phone, programInterest }) {
  return await post('/study-inquiries', { studentName, school, grade, phone, programInterest });
}
