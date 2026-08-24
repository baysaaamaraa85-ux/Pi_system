import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  getStudentProgress,
  getStudentSchedule,
  getStudentAttendance
} from '../controllers/student.controller.js';

const router = express.Router();

// Бүх route-ууд нэвтэрсэн байх ёстой
router.use(authenticate);

// GET /api/students/:id/progress - Сурагчийн явц
router.get('/:id/progress', getStudentProgress);

// GET /api/students/:id/schedule - Сурагчийн хуваарь
router.get('/:id/schedule', getStudentSchedule);

// GET /api/students/:id/attendance - Ирцийн түүх
router.get('/:id/attendance', getStudentAttendance);

export default router;
