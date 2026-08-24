import { get, post } from './api.js';

// Бүх салбарууд
export async function getBranches() {
  return await get('/branches');
}

// Нэг салбарын дэлгэрэнгүй
export async function getBranchById(id) {
  return await get(`/branches/${id}`);
}

// Түвшин тогтоох цаг захиалах хүсэлт илгээх
export async function sendAssessmentRequest(branchId, phone) {
  return await post(`/branches/${branchId}/assessment-requests`, { phone });
}
