import { get } from './api.js';

export const getAdminStats = () => get('/admin/stats');
export const getAdminWeeklyAttendance = () => get('/admin/attendance-week');
export const getAdminPaymentStatus = () => get('/admin/payment-status');
export const getAdminRecentStudents = () => get('/admin/recent-students');
