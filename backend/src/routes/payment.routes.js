import express from 'express';
import {
  createPayment,
  getPayment,
  createQpayInvoice,
  checkQpayPayment,
  qpayCallback,
  markBankTransfer,
} from '../controllers/payment.controller.js';

const router = express.Router();

// POST /api/payments - Хөтөлбөр/багц сонгосны дараа төлбөр (pending) үүсгэх
router.post('/', createPayment);

// QPay callback (QPay сервер өөрөө дуудна)
router.post('/qpay/callback', qpayCallback);

// GET /api/payments/:id - Төлбөрийн одоогийн төлөв
router.get('/:id', getPayment);

// POST /api/payments/:id/qpay - QR код үүсгэх
router.post('/:id/qpay', createQpayInvoice);

// POST /api/payments/:id/qpay/check - Төлөгдсөн эсэхийг шалгах
router.post('/:id/qpay/check', checkQpayPayment);

// POST /api/payments/:id/bank-transfer - Дансаар шилжүүлсэн гэж тэмдэглэх
router.post('/:id/bank-transfer', markBankTransfer);

export default router;
