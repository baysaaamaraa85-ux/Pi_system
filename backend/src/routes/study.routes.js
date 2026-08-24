import express from 'express';
import { createStudyInquiry } from '../controllers/study.controller.js';

const router = express.Router();

// POST /api/study-inquiries - "Суралцах эхний алхмаа хийе" хуудасны хүсэлт
router.post('/', createStudyInquiry);

export default router;
