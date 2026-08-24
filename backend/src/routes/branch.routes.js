import express from 'express';
import { getAllBranches, getBranchById, createAssessmentRequest } from '../controllers/branch.controller.js';

const router = express.Router();

// GET /api/branches - Бүх салбарууд
router.get('/', getAllBranches);

// GET /api/branches/:id - Нэг салбарын дэлгэрэнгүй
router.get('/:id', getBranchById);

// POST /api/branches/:id/assessment-requests - Түвшин тогтоох цаг захиалах хүсэлт
router.post('/:id/assessment-requests', createAssessmentRequest);

export default router;
