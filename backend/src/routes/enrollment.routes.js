import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createEnrollmentRequest,
  getEnrollmentRequest,
  getMyEnrollmentRequests,
  updateEnrollmentRequestStatus,
} from '../controllers/enrollment.controller.js';

const router = express.Router();

// POST /api/enrollment-requests - Бүртгэлийн wizard-ийн эцсийн хүсэлт
router.post('/', createEnrollmentRequest);

// GET /api/enrollment-requests/mine - Нэвтэрсэн багшид ирсэн хүсэлтүүд
router.get('/mine', authenticate, authorize('teacher'), getMyEnrollmentRequests);

// PATCH /api/enrollment-requests/:id - Багш хүсэлтийн төлөв өөрчлөх
router.patch('/:id', authenticate, authorize('teacher'), updateEnrollmentRequestStatus);

// GET /api/enrollment-requests/:id - Хүсэлтийн төлөв
router.get('/:id', getEnrollmentRequest);

export default router;
