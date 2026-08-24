import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { enrollInLesson, createLesson } from '../controllers/lesson.controller.js';

const router = express.Router();

// POST /api/lessons - Нэвтэрсэн багш өөрийн хуваарьт шинэ хичээл нэмэх
router.post('/', authenticate, authorize('teacher'), createLesson);

// POST /api/lessons/:id/enroll - Сонгосон хуваарийн цагт сурагч бүртгэх
router.post('/:id/enroll', enrollInLesson);

export default router;
