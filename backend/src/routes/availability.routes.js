import express from 'express';
import { getTeacherAvailability } from '../controllers/availability.controller.js';

const router = express.Router();

// GET /api/availability/teacher/:id - Багшийн нээлттэй цагууд
router.get('/teacher/:id', getTeacherAvailability);

export default router;
