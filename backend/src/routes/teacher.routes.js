import express from 'express';
import {
  getAllTeachers,
  getTeacherById,
  getTeacherSchedule,
  createContactRequest
} from '../controllers/teacher.controller.js';

const router = express.Router();

// GET /api/teachers - Бүх багш нарын жагсаалт (шүүлтүүртэй)
router.get('/', getAllTeachers);

// GET /api/teachers/:id - Нэг багшийн дэлгэрэнгүй
router.get('/:id', getTeacherById);

// GET /api/teachers/:id/schedule - Багшийн хуваарь
router.get('/:id/schedule', getTeacherSchedule);

// POST /api/teachers/:id/contact-requests - "Багштай холбогдмоор байна уу?"
router.post('/:id/contact-requests', createContactRequest);

export default router;
