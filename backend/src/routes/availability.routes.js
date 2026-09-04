import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getTeacherAvailability,
  getMyAvailability,
  createAvailability,
  replaceMyAvailability,
  deleteAvailability,
} from '../controllers/availability.controller.js';

const router = express.Router();

// GET /api/availability/teacher/:id - Багшийн нээлттэй цагууд (нээлттэй, бүртгэлийн flow ашиглана)
router.get('/teacher/:id', getTeacherAvailability);

// Дараах бүгд: зөвхөн нэвтэрсэн багш өөрийн хуваарь дээр
router.get('/me', authenticate, authorize('teacher'), getMyAvailability);
router.post('/', authenticate, authorize('teacher'), createAvailability);
router.put('/me', authenticate, authorize('teacher'), replaceMyAvailability);
router.delete('/:id', authenticate, authorize('teacher'), deleteAvailability);

export default router;
