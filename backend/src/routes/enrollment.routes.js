import express from 'express';
import {
  createEnrollmentRequest,
  getEnrollmentRequest,
} from '../controllers/enrollment.controller.js';

const router = express.Router();

// POST /api/enrollment-requests - Бүртгэлийн wizard-ийн эцсийн хүсэлт
router.post('/', createEnrollmentRequest);

// GET /api/enrollment-requests/:id - Хүсэлтийн төлөв
router.get('/:id', getEnrollmentRequest);

export default router;
