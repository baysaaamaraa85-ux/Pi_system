import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Бүртгүүлэх validation
const registerValidation = [
  body('email').isEmail().withMessage('И-мэйл буруу байна'),
  body('password').isLength({ min: 6 }).withMessage('Нууц үг 6-аас дээш тэмдэгт байх ёстой'),
  body('firstName').notEmpty().withMessage('Нэр оруулна уу'),
  body('lastName').notEmpty().withMessage('Овог оруулна уу'),
  body('role').isIn(['student', 'teacher', 'parent']).withMessage('Буруу хэрэглэгчийн төрөл')
];

// Нэвтрэх validation
const loginValidation = [
  body('email').isEmail().withMessage('И-мэйл буруу байна'),
  body('password').notEmpty().withMessage('Нууц үг оруулна уу')
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', authenticate, getMe);

export default router;
