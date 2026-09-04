import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getStats,
  getWeeklyAttendance,
  getPaymentStatus,
  getRecentStudents,
} from '../controllers/admin.controller.js';

const router = express.Router();

// Бүх route зөвхөн admin эрхтэй
router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/attendance-week', getWeeklyAttendance);
router.get('/payment-status', getPaymentStatus);
router.get('/recent-students', getRecentStudents);

export default router;
