import { get, post, patch } from './api.js';

// Бүртгэлийн wizard-ийн эцсийн хүсэлт үүсгэх
export async function createEnrollmentRequest(payload) {
  return post('/enrollment-requests', payload);
}

// Нэвтэрсэн багшид ирсэн бүртгэлийн хүсэлтүүд
export async function getMyEnrollmentRequests() {
  return get('/enrollment-requests/mine');
}

// Хүсэлтийн төлөв өөрчлөх (confirmed / cancelled)
export async function updateEnrollmentRequestStatus(id, status) {
  return patch(`/enrollment-requests/${encodeURIComponent(id)}`, { status });
}
